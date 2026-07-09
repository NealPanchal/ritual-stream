'use client';

/**
 * src/components/StreamErrorScreen.tsx
 *
 * Premium error screen matching Cineby aesthetic:
 * Features:
 *  - Dark premium modal
 *  - "No sources available for server X"
 *  - Recommended servers list (Available / Unavailable)
 *  - Try Again / Show All Servers buttons
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Server, RefreshCw } from 'lucide-react';
import {
  PROVIDER_ROSTER,
  PROVIDER_LABELS,
  type ProviderId,
  type ProviderHealth,
} from '@/lib/providers';
import type { FailureReason } from '@/lib/stream-logger';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StreamErrorScreenProps {
  error:           string | null;
  failureReason:   FailureReason | null;
  currentProvider: ProviderId;
  providerHealth:  Partial<Record<ProviderId, ProviderHealth>>;
  retryCountdown:  number;
  retryCount:      number;
  exhausted:       boolean;
  embedUrl:        string | null;
  onRetry:         () => void;
  onSwitchProvider:(p: ProviderId) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StreamErrorScreen({
  currentProvider,
  providerHealth,
  exhausted,
  onRetry,
  onSwitchProvider,
}: StreamErrorScreenProps) {
  const [showAllServers, setShowAllServers] = useState(false);

  // Determine which servers to show
  // Ensure current provider is at the top of the list
  const otherProviders = PROVIDER_ROSTER.filter((id) => id !== currentProvider);
  const displayRoster = [currentProvider, ...otherProviders];
  const visibleProviders = showAllServers ? displayRoster : displayRoster.slice(0, 3);
  
  // Count how many are considered "available" (not known to be offline and not the current failed one)
  const availableCount = PROVIDER_ROSTER.filter(id => id !== currentProvider && providerHealth[id]?.status !== 'offline').length;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/95 z-20 font-sans backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-[420px] rounded-[24px] bg-[#0a0a0c] border border-white/[0.04] overflow-hidden shadow-2xl p-6 relative"
      >
        {/* Top X icon */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-[14px] bg-[#0a1a3a]/40 border border-blue-500/20 flex items-center justify-center mb-5">
            <X size={20} className="text-[#3b82f6]" />
          </div>
          <h2 className="text-white text-lg font-bold mb-1.5">Playback Error</h2>
          <p className="text-gray-400 text-[13px] text-center">
            {exhausted ? 'All sources are currently unavailable.' : `No sources available for server ${PROVIDER_LABELS[currentProvider] ?? currentProvider}`}
          </p>
        </div>

        {/* Recommended Servers Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-white text-[13px] font-semibold">Recommended Servers</span>
          <span className="text-gray-500 text-[11px]">{availableCount} available</span>
        </div>

        {/* Servers List */}
        <div className="space-y-2 mb-6">
          <AnimatePresence initial={false}>
            {visibleProviders.map((id) => {
              const isCurrent = id === currentProvider;
              // If it's the current provider that just failed, it's unavailable.
              // Otherwise, rely on health checks (default to Available).
              const isAvailable = !isCurrent && providerHealth[id]?.status !== 'offline';

              return (
                <motion.button
                  key={id}
                  onClick={() => {
                    if (!isCurrent) onSwitchProvider(id);
                  }}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`
                    w-full flex items-center justify-between p-3 rounded-[16px] text-left transition-all
                    ${isCurrent
                      ? 'bg-[#0a1120] border border-blue-500/20'
                      : 'bg-[#101014] border border-white/[0.03] hover:bg-[#16161a] hover:border-white/[0.08]'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-[#0a1a3a]/60 border border-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Server size={18} className="text-[#3b82f6]" />
                    </div>
                    <div>
                      <div className="text-white text-[13px] font-semibold mb-0.5">
                        {PROVIDER_LABELS[id] ?? id}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {isAvailable ? 'Available' : 'Unavailable'}
                      </div>
                    </div>
                  </div>
                  {isCurrent && (
                    <div className="px-2.5 py-1 rounded-full bg-blue-500/10 text-[#3b82f6] text-[10px] font-bold uppercase tracking-wider">
                      Current
                    </div>
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="flex-1 py-3 rounded-[14px] border border-[#222226] text-gray-300 text-[13px] font-semibold hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
          {!showAllServers && displayRoster.length > 3 && (
            <button
              onClick={() => setShowAllServers(true)}
              className="flex-1 py-3 rounded-[14px] bg-[#0052ff] text-white text-[13px] font-semibold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-colors"
            >
              Show All Servers
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
