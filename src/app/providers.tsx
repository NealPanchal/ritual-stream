/**
 * providers.tsx — Web3 Provider Stack
 *
 * Wraps the entire app with the necessary providers for:
 * - wagmi (Ethereum interaction hooks)
 * - RainbowKit (wallet connection UI)
 * - TanStack Query (async state management, required by wagmi)
 *
 * Configured for Ritual Chain Testnet with a custom dark theme.
 */

'use client';

import React from 'react';

// Polyfill localStorage for SSR build workers if it's missing or broken
if (typeof window === 'undefined') {
  const noop = () => null;
  const noopObj = {
    getItem: noop,
    setItem: noop,
    removeItem: noop,
    clear: noop,
    key: noop,
    length: 0,
  };
  
  if (typeof global.localStorage === 'undefined' || !global.localStorage.getItem) {
    (global as any).localStorage = noopObj;
  }
}
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ritualChain } from '@/lib/blockchain';

import '@rainbow-me/rainbowkit/styles.css';

// ============================================================================
// Configuration
// ============================================================================

/**
 * wagmi + RainbowKit config for Ritual Chain Testnet.
 * WalletConnect projectId is required for WalletConnect-based wallets.
 * Get your own at https://cloud.walletconnect.com
 */
const config = getDefaultConfig({
  appName: 'RitualStream',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'ritualstream_demo_project',
  chains: [ritualChain],
  ssr: true,
});

/** TanStack Query client for wagmi's async state */
const queryClient = new QueryClient();

// ============================================================================
// Custom RainbowKit Theme
// ============================================================================

const ritualStreamTheme = darkTheme({
  accentColor: '#00F5A0',
  accentColorForeground: '#000000',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

// Override specific theme tokens to match Ritual branding
ritualStreamTheme.colors.modalBackground = '#0a0a0b';
ritualStreamTheme.colors.modalBorder = 'rgba(0, 245, 160, 0.12)';
ritualStreamTheme.colors.profileForeground = '#0d0d0d';
ritualStreamTheme.colors.connectButtonBackground = '#0d0d0d';
ritualStreamTheme.colors.connectButtonInnerBackground = '#0a0a0b';
ritualStreamTheme.shadows.connectButton = '0 4px 20px rgba(0, 245, 160, 0.15)';

// ============================================================================
// Provider Component
// ============================================================================

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={ritualStreamTheme} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
