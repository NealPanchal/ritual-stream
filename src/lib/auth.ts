/**
 * auth.ts — Access control logic with anti-tamper protection
 *
 * Manages 24-hour streaming access grants stored in localStorage.
 * Uses HMAC signing to detect manual edits and prevent bypass.
 * Access is tied to the wallet address that made the payment.
 */

import { 
  ACCESS_DURATION_MS, 
  checkRecentPayment, 
  isWhitelisted,
  basePublicClient,
  CONTRACT_ADDRESS,
  BASE_STREAM_ACCESS_ABI
} from './blockchain';
import { verifyMessage } from 'viem';

// ============================================================================
// Types
// ============================================================================

export interface AccessData {
  /** Wallet address that paid for access */
  walletAddress: string;
  /** Transaction hash confirming the payment */
  txHash: string;
  /** Unix timestamp (ms) when access was granted */
  grantedAt: number;
  /** Unix timestamp (ms) when access expires */
  expiresAt: number;
}

export interface AccessStatus {
  /** Whether the user currently has valid, unexpired access */
  isValid: boolean;
  /** Access data if valid, null otherwise */
  data: AccessData | null;
  /** Time remaining in milliseconds (0 if expired) */
  timeRemaining: number;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'ritualstream_access';
const SIGNATURE_KEY = 'ritualstream_sig';

/**
 * Client-side signing secret. In production, this would be more robust
 * (e.g., derived from a server-issued token). For MVP, this prevents
 * casual localStorage edits.
 */
const SIGNING_SECRET = 'ritualstream_v1_0x42_secure_key';

// ============================================================================
// HMAC Signing (Anti-Tamper)
// ============================================================================

/**
 * Generate a simple hash signature for the access data.
 * Uses a basic HMAC-like approach with Web Crypto API.
 */
async function generateSignature(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(SIGNING_SECRET);
  const msgData = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, msgData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify that the stored data hasn't been tampered with.
 */
async function verifySignature(data: string, signature: string): Promise<boolean> {
  const expected = await generateSignature(data);
  return expected === signature;
}

// ============================================================================
// Access Management
// ============================================================================

/**
 * Grant 24-hour streaming access after successful payment.
 *
 * @param txHash - Confirmed transaction hash
 * @param walletAddress - Wallet that made the payment
 */
export async function grantAccess(
  txHash: string,
  walletAddress: string
): Promise<AccessData> {
  const now = Date.now();
  const accessData: AccessData = {
    walletAddress: walletAddress.toLowerCase(),
    txHash,
    grantedAt: now,
    expiresAt: now + ACCESS_DURATION_MS,
  };

  const dataString = JSON.stringify(accessData);
  const signature = await generateSignature(dataString);

  // Store both the data and its signature
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
    localStorage.setItem(STORAGE_KEY, dataString);
    localStorage.setItem(SIGNATURE_KEY, signature);
  }

  return accessData;
}

/**
 * Check if the user currently has valid streaming access.
 * Validates both expiry time and HMAC signature integrity.
 *
 * @param walletAddress - Optional: verify access belongs to this wallet
 */
export async function checkAccess(walletAddress?: string): Promise<AccessStatus> {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
      return { isValid: false, data: null, timeRemaining: 0 };
    }

    // VIP WHITELIST CHECK: Direct lifetime access for specific addresses
    if (walletAddress && isWhitelisted(walletAddress)) {
      return {
        isValid: true,
        data: {
          walletAddress: walletAddress.toLowerCase(),
          txHash: '0x_WHITELISTED_VIP_ACCESS',
          grantedAt: Date.now(),
          expiresAt: Date.now() + (100 * 365 * 24 * 60 * 60 * 1000) // 100 years
        },
        timeRemaining: 100 * 365 * 24 * 60 * 60 * 1000
      };
    }

    
    const dataString = localStorage.getItem(STORAGE_KEY);
    const signature = localStorage.getItem(SIGNATURE_KEY);

    // No access data stored locally
    if (!dataString || !signature) {
      // RECOVERY: If we have a wallet address, check on-chain contract and indexer history
      if (walletAddress) {
        // 1. Try On-chain Smart Contract Verification First
        try {
          const onChainHasAccess = await basePublicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: BASE_STREAM_ACCESS_ABI,
            functionName: 'hasAccess',
            args: [walletAddress as `0x${string}`],
          });

          if (onChainHasAccess) {
            console.info('[RitualStream] Found valid on-chain contract access for:', walletAddress);
            const restoredData = await grantAccess('0x_ONCHAIN_CONTRACT_VALIDATED', walletAddress);
            return {
              isValid: true,
              data: restoredData,
              timeRemaining: Math.max(0, restoredData.expiresAt - Date.now())
            };
          }
        } catch (contractError) {
          console.warn('[RitualStream] On-chain contract validation bypassed/failed, falling back to explorer:', contractError);
        }

        // 2. Fallback to Basescan Account History
        const recentTxHash = await checkRecentPayment(walletAddress);
        if (recentTxHash) {
          console.info('[RitualStream] Found recent on-chain payment on explorer, restoring access for:', walletAddress);
          const restoredData = await grantAccess(recentTxHash, walletAddress);
          return {
            isValid: true,
            data: restoredData,
            timeRemaining: Math.max(0, restoredData.expiresAt - Date.now())
          };
        }
      }
      return { isValid: false, data: null, timeRemaining: 0 };
    }

    // Verify HMAC signature (anti-tamper check)
    const isIntact = await verifySignature(dataString, signature);
    if (!isIntact) {
      console.warn('[RitualStream] Access data integrity check failed — possible tampering detected');;
      
      // Even if tampered, check if we can recover from on-chain contract or history
      if (walletAddress) {
        try {
          const onChainHasAccess = await basePublicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: BASE_STREAM_ACCESS_ABI,
            functionName: 'hasAccess',
            args: [walletAddress as `0x${string}`],
          });

          if (onChainHasAccess) {
            const restoredData = await grantAccess('0x_ONCHAIN_CONTRACT_VALIDATED', walletAddress);
            return {
              isValid: true,
              data: restoredData,
              timeRemaining: Math.max(0, restoredData.expiresAt - Date.now())
            };
          }
        } catch (contractError) {
          console.warn('[RitualStream] On-chain contract recovery bypassed/failed:', contractError);
        }

        const recentTxHash = await checkRecentPayment(walletAddress);
        if (recentTxHash) {
          const restoredData = await grantAccess(recentTxHash, walletAddress);
          return {
            isValid: true,
            data: restoredData,
            timeRemaining: Math.max(0, restoredData.expiresAt - Date.now())
          };
        }
      }

      revokeAccess();
      return { isValid: false, data: null, timeRemaining: 0 };
    }

    const data: AccessData = JSON.parse(dataString);
    const now = Date.now();
    
    // If a wallet address is provided, verify it matches
    if (walletAddress && data.walletAddress !== walletAddress.toLowerCase()) {
      // Check if the current wallet has its own payment
      const recentTxHash = await checkRecentPayment(walletAddress);
      if (recentTxHash) {
        const restoredData = await grantAccess(recentTxHash, walletAddress);
        return {
          isValid: true,
          data: restoredData,
          timeRemaining: Math.max(0, restoredData.expiresAt - now)
        };
      }
      return { isValid: false, data: null, timeRemaining: 0 };
    }

    const timeRemaining = Math.max(0, data.expiresAt - now);

    // Check if access has expired
    if (timeRemaining === 0) {
      // Check if they renewed just now and it hasn't synced locally
      if (walletAddress) {
        const recentTxHash = await checkRecentPayment(walletAddress);
        if (recentTxHash && recentTxHash !== data.txHash) {
          const restoredData = await grantAccess(recentTxHash, walletAddress);
          return {
            isValid: true,
            data: restoredData,
            timeRemaining: Math.max(0, restoredData.expiresAt - now)
          };
        }
      }
      return { isValid: false, data, timeRemaining: 0 };
    }

    return { isValid: true, data, timeRemaining };
  } catch (error) {
    console.error('[RitualStream] Error checking access:', error);
    return { isValid: false, data: null, timeRemaining: 0 };
  }
}

export const ADMIN_ADDRESS = '0x5041A07E593E94747881cd12C49ba5f1545512e2';

/**
 * Utility to package an Admin-signed unlimited access pass token.
 * Encodes the signed payload inside a base64 string.
 */
export function packageAdminToken(dataString: string, signature: string): string {
  const payload = {
    data: dataString,
    sig: signature
  };

  return typeof window !== 'undefined' 
    ? window.btoa(JSON.stringify(payload))
    : Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Redeem an admin access pass token.
 * Validates the cryptographic EIP-191 signature against the hardcoded Admin Address,
 * checks that the pass belongs to the currently connected user, and saves it.
 */
export async function redeemAdminPass(token: string, connectedAddress: string): Promise<{ success: boolean; error?: string }> {
  try {
    const raw = typeof window !== 'undefined'
      ? window.atob(token.trim())
      : Buffer.from(token.trim(), 'base64').toString('utf-8');

    const payload = JSON.parse(raw);
    if (!payload.data || !payload.sig) {
      return { success: false, error: 'Invalid token structure.' };
    }

    // Cryptographically verify EIP-191 signature using viem's verifyMessage
    // This is mathematically secure and prevents static key exposures.
    const isValidSignature = await verifyMessage({
      address: ADMIN_ADDRESS as `0x${string}`,
      message: payload.data,
      signature: payload.sig as `0x${string}`
    });

    if (!isValidSignature) {
      return { success: false, error: 'Cryptographic signature verification failed. Token is invalid or forged.' };
    }

    const data: AccessData = JSON.parse(payload.data);
    if (data.walletAddress.toLowerCase().trim() !== connectedAddress.toLowerCase().trim()) {
      return { success: false, error: `This token was generated for wallet ${data.walletAddress}. Connect that wallet to activate it.` };
    }

    // Save to local storage under HMAC signature format (since we verified the ECDSA signature,
    // we save the valid pass, signing it locally using the internal verifySignature to keep checkAccess happy)
    const localHmacSig = await generateSignature(payload.data);
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      localStorage.setItem(STORAGE_KEY, payload.data);
      localStorage.setItem(SIGNATURE_KEY, localHmacSig);
    }

    return { success: true };
  } catch (error: any) {
    console.error('[RitualStream] Redemption error:', error);
    return { success: false, error: 'Failed to decode token. Ensure you copied the exact, complete token string.' };
  }
}

/**
 * Revoke access by clearing all stored access data.
 */
export function revokeAccess(): void {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && typeof localStorage.removeItem === 'function') {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SIGNATURE_KEY);
  }
}

/**
 * Get formatted time remaining as HH:MM:SS string.
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '00:00:00';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((v) => v.toString().padStart(2, '0'))
    .join(':');
}
