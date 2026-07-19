/**
 * blockchain.ts — Ritual Chain payment constants & on-chain verification
 *
 * Handles all blockchain-specific logic including payment configuration,
 * chain setup, and transaction verification against the Ritual Chain Testnet.
 *
 * Ritual Chain Testnet:
 *   Chain ID:    1979
 *   Currency:    RITUAL (18 decimals, testnet)
 *   Block Time:  ~350ms
 *   TX Types:    EIP-1559 + 0x10, 0x11, 0x12, 0x77
 *   RPC:         https://rpc.ritualfoundation.org
 *   Explorer:    https://explorer.ritualfoundation.org
 *   Faucet:      https://faucet.ritualfoundation.org
 */

import { createPublicClient, http, parseEther, formatEther, isAddressEqual, defineChain } from 'viem';

/** Ritual Chain Testnet definition */
export const ritualChain = defineChain({
  id: 1979,
  name: 'Ritual Chain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ritual',
    symbol: 'RITUAL',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.ritualfoundation.org'],
      webSocket: ['wss://rpc.ritualfoundation.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Ritual Explorer',
      url: 'https://explorer.ritualfoundation.org',
    },
  },
  testnet: true,
});

/** Ritual Explorer API configuration */
export const RITUAL_EXPLORER_API_URL = 'https://explorer.ritualfoundation.org/api';


// ============================================================================
// Payment Configuration
// ============================================================================

/** Wallet address that receives streaming access payments */
export const PAYMENT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x2bf0Cc58fdB1136e6BB8b3D334CA9Fa359824771') as `0x${string}`;

/** VIP addresses with direct lifetime access */
export const WHITELIST_ADDRESSES = [
  '0x5041A07E593E94747881cd12C49ba5f1545512e2',
  '0x287B63C962ace27b947Dad18978D8A66219CbC2e',
  '0xfbd686785bc30d605f0e38b510f3d4c5901ca6de',
  '0xaC7E4a98F5C0F2C06642948aAD44105Bdd8E9E0E',
  '0x1AC2c5AAb7b5ECe0EEF719C4013b25842eF37cCA'
].map(addr => addr.toLowerCase());

/** Check if an address is in the VIP whitelist */
export const isWhitelisted = (address: string | undefined): boolean => {
  if (!address) return false;
  return WHITELIST_ADDRESSES.includes(address.toLowerCase());
};


/** Cost for 24-hour unlimited streaming access (in RITUAL) */
export const PAYMENT_AMOUNT_ETH = '0.01';
export const PAYMENT_AMOUNT_RITUAL = '0.01';

/** Cost in wei for smart contract / transaction value */
export const PAYMENT_AMOUNT_WEI = parseEther(PAYMENT_AMOUNT_RITUAL);

/** Ritual Chain Testnet chain ID */
export const RITUAL_CHAIN_ID = 1979;

/** Access duration in milliseconds (24 hours) */
export const ACCESS_DURATION_MS = 24 * 60 * 60 * 1000;

/** Display price string (used in UI) */
export const DISPLAY_PRICE = '0.01 RIT';

// ============================================================================
// Public Client (for read-only on-chain queries)
// ============================================================================

/**
 * Viem public client for Ritual Chain Testnet.
 * Used to verify transactions on-chain without requiring a connected wallet.
 */
export const basePublicClient = createPublicClient({
  chain: ritualChain,
  transport: http(process.env.NEXT_PUBLIC_RITUAL_RPC || 'https://rpc.ritualfoundation.org'),
});

export const CONTRACT_ADDRESS = PAYMENT_ADDRESS;

export const BASE_STREAM_ACCESS_ABI = [ // RitualStreamAccess ABI
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
  { "inputs": [], "name": "ContractNotPaused", "type": "error" },
  { "inputs": [], "name": "ContractPaused", "type": "error" },
  { "inputs": [], "name": "InvalidAddress", "type": "error" },
  { "inputs": [], "name": "InvalidPayment", "type": "error" },
  { "inputs": [], "name": "NoFundsToWithdraw", "type": "error" },
  { "inputs": [], "name": "NotOwner", "type": "error" },
  { "inputs": [], "name": "ReentrantCall", "type": "error" },
  { "inputs": [], "name": "WithdrawalFailed", "type": "error" },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "FundsWithdrawn",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "LifetimeAccessGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "LifetimeAccessRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }
    ],
    "name": "OwnershipTransferStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "uint64", "name": "expiresAt", "type": "uint64" }
    ],
    "name": "PassUnlocked",
    "type": "event"
  },
  { "anonymous": false, "inputs": [], "name": "Paused", "type": "event" },
  { "anonymous": false, "inputs": [], "name": "Unpaused", "type": "event" },
  {
    "inputs": [],
    "name": "PASS_COST",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "PASS_DURATION",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "acceptOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "accessExpiry",
    "outputs": [{ "internalType": "uint64", "name": "", "type": "uint64" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "grantLifetimeAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "hasAccess",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "isLifetimeUser",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pausePayments",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pendingOwner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "purchaseAccess",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "resumePayments",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "revokeLifetimeAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawFunds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
] as const;

// ============================================================================
// Transaction Verification
// ============================================================================

export interface TransactionVerification {
  isValid: boolean;
  error?: string;
  blockNumber?: bigint;
  from?: string;
  to?: string;
  value?: string;
}

/**
 * Verify a transaction hash on-chain to confirm:
 * 1. The transaction exists and is confirmed
 * 2. It was sent to the correct payment address
 * 3. The value meets or exceeds the required amount
 *
 * @param txHash - The transaction hash to verify
 * @param expectedFrom - Optional: verify the sender address
 * @returns Verification result with details
 */
export async function verifyTransaction(
  txHash: `0x${string}`,
  expectedFrom?: string
): Promise<TransactionVerification> {
  try {
    // Fetch the transaction receipt to confirm it's mined
    const receipt = await basePublicClient.getTransactionReceipt({
      hash: txHash,
    });

    if (!receipt) {
      return { isValid: false, error: 'Transaction not found or not yet confirmed' };
    }

    if (receipt.status !== 'success') {
      return { isValid: false, error: 'Transaction reverted on-chain' };
    }

    // Fetch the full transaction to check value and recipient
    const tx = await basePublicClient.getTransaction({
      hash: txHash,
    });

    if (!tx) {
      return { isValid: false, error: 'Transaction data not found' };
    }

    // Verify recipient
    if (tx.to?.toLowerCase() !== PAYMENT_ADDRESS.toLowerCase()) {
      return {
        isValid: false,
        error: 'Transaction was not sent to the correct payment address',
      };
    }

    // Verify amount (must be >= required payment)
    if (tx.value < PAYMENT_AMOUNT_WEI) {
      return {
        isValid: false,
        error: `Insufficient payment: sent ${formatEther(tx.value)} RITUAL, required ${PAYMENT_AMOUNT_RITUAL} RITUAL`,
      };
    }

    // Verify sender if specified
    if (expectedFrom && tx.from.toLowerCase() !== expectedFrom.toLowerCase()) {
      return {
        isValid: false,
        error: 'Transaction was sent from a different wallet',
      };
    }

    return {
      isValid: true,
      blockNumber: receipt.blockNumber,
      from: tx.from,
      to: tx.to,
      value: formatEther(tx.value),
    };
  } catch (error) {
    console.error('Transaction verification failed:', error);
    return {
      isValid: false,
      error: 'Failed to verify transaction on-chain. Please try again.',
    };
  }
}

/**
 * Check if an address has sent the required payment to the recipient
 * address within the last 24 hours by scanning transaction history.
 *
 * @param userAddress - The wallet address to check
 * @returns Transaction hash if payment found, null otherwise
 */
export async function checkRecentPayment(userAddress: string): Promise<string | null> {
  if (!userAddress) return null;

  try {
    // Note: In production, we would use an API key. 
    // For local dev/demo, we use the public endpoint.
    const url = `${RITUAL_EXPLORER_API_URL}?module=account&action=txlist&address=${userAddress}&startblock=0&endblock=99999999&sort=desc&offset=100`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== '1' || !Array.isArray(data.result)) {
      console.warn('[RitualStream] Could not fetch transaction history:', data.message);
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    const twentyFourHoursAgo = now - 86400;

    // Look for a successful transaction to our payment address with the correct value
    const validTx = data.result.find((tx: any) => {
      const isCorrectRecipient = isAddressEqual(tx.to as `0x${string}`, PAYMENT_ADDRESS);
      const isPast24h = parseInt(tx.timeStamp) > twentyFourHoursAgo;
      const isSuccess = tx.isError === '0';
      const isCorrectValue = tx.value === PAYMENT_AMOUNT_WEI.toString();

      return isCorrectRecipient && isPast24h && isSuccess && isCorrectValue;
    });

    return validTx ? validTx.hash : null;
  } catch (error) {
    // Expected to fail if API has no CORS or is down/404, use warn instead of error
    console.warn('[RitualStream] Check recent payment fallback skipped (Network/CORS).');
    return null;
  }
}

/**
 * Get a shortened, display-friendly version of an Ethereum address.
 * Example: 0x1234...5678
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Get the display price string (RIT, no USD conversion for testnet).
 */
export function getApproxUSD(): string {
  return DISPLAY_PRICE;
}
