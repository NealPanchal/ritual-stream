/**
 * useAccess.ts — Custom hook for real-time access control
 *
 * Provides reactive access state that updates every second.
 * Handles automatic redirect when access expires.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { checkAccess, formatTimeRemaining, type AccessData } from '@/lib/auth';

interface UseAccessReturn {
  /** Whether the user has valid, unexpired access */
  hasAccess: boolean;
  /** Whether the initial access check is still loading */
  loading: boolean;
  /** Remaining time in milliseconds */
  timeRemaining: number;
  /** Formatted time remaining (HH:MM:SS) */
  timeFormatted: string;
  /** Access data (wallet, tx hash, timestamps) */
  accessData: AccessData | null;
  /** Manually re-check access status */
  recheck: () => Promise<void>;
}

/**
 * Hook to manage streaming access state with real-time countdown.
 *
 * @param redirectOnExpire - If true, redirect to /unlock when access expires
 * @param walletAddress - Optional: verify access belongs to this specific wallet
 */
export function useAccess(
  redirectOnExpire = false,
  walletAddress?: string
): UseAccessReturn {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [accessData, setAccessData] = useState<AccessData | null>(null);

  const performCheck = useCallback(async () => {
    try {
      const status = await checkAccess(walletAddress);
      setHasAccess(status.isValid);
      setTimeRemaining(status.timeRemaining);
      setAccessData(status.data);

      // If access has expired and redirect is enabled
      if (!status.isValid && redirectOnExpire && !loading) {
        router.push('/unlock');
      }
    } catch {
      setHasAccess(false);
      setTimeRemaining(0);
      setAccessData(null);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, redirectOnExpire, router, loading]);

  // Initial check on mount
  useEffect(() => {
    performCheck();
  }, [performCheck]);

  // Update countdown every second
  useEffect(() => {
    if (!hasAccess || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = Math.max(0, prev - 1000);

        // Access just expired
        if (next === 0) {
          setHasAccess(false);
          if (redirectOnExpire) {
            router.push('/unlock');
          }
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hasAccess, timeRemaining, redirectOnExpire, router]);

  return {
    hasAccess,
    loading,
    timeRemaining,
    timeFormatted: formatTimeRemaining(timeRemaining),
    accessData,
    recheck: performCheck,
  };
}
