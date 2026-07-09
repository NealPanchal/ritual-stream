/**
 * AccessBadge.tsx — Active pass indicator
 *
 * Shows a pill-shaped badge with pulsing green dot when the user
 * has an active 24-hour streaming pass.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap } from 'lucide-react';

interface AccessBadgeProps {
  /** Time remaining in milliseconds */
  timeRemaining: number;
  /** Formatted time remaining */
  timeFormatted: string;
  /** Style variant */
  variant?: 'default' | 'compact' | 'hero';
}

const AccessBadge: React.FC<AccessBadgeProps> = ({
  timeRemaining,
  timeFormatted,
  variant = 'default',
}) => {
  const isActive = timeRemaining > 0;
  const isUrgent = timeRemaining < 60 * 60 * 1000;

  if (!isActive) return null;

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-xs font-semibold text-emerald-400">Active</span>
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <motion.div
        className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500/10 to-base-blue/10 border border-emerald-500/20 rounded-2xl backdrop-blur-sm"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <Shield size={18} className="text-emerald-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-emerald-400">24h Pass Active</span>
          <span className={`text-xs font-mono ${isUrgent ? 'text-amber-400' : 'text-gray-400'}`}>
            {timeFormatted} remaining
          </span>
        </div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      className="flex items-center gap-2.5 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
      </span>
      <Zap size={14} className="text-emerald-400" />
      <span className="text-sm font-semibold text-emerald-400 hidden min-[400px]:inline-block">Active Pass</span>
      <span className="text-xs text-gray-500 font-mono">{timeFormatted}</span>
    </motion.div>
  );
};

export default AccessBadge;
