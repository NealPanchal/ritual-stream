/**
 * CountdownTimer.tsx — Real-time expiry countdown
 *
 * Displays remaining access time in HH:MM:SS format.
 * Visual urgency increases as time runs low.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  /** Time remaining in milliseconds */
  timeRemaining: number;
  /** Formatted time string (HH:MM:SS) */
  timeFormatted: string;
  /** Display variant */
  variant?: 'default' | 'compact' | 'large';
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  timeRemaining,
  timeFormatted,
  variant = 'default',
}) => {
  const isUrgent = timeRemaining < 60 * 60 * 1000; // Less than 1 hour
  const isCritical = timeRemaining < 15 * 60 * 1000; // Less than 15 minutes

  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center gap-2 text-sm font-mono ${
          isCritical
            ? 'text-red-400'
            : isUrgent
            ? 'text-amber-400'
            : 'text-gray-400'
        }`}
      >
        <Clock size={14} />
        <span>{timeFormatted}</span>
      </div>
    );
  }

  if (variant === 'large') {
    return (
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          {isCritical ? (
            <AlertTriangle size={16} className="text-red-400" />
          ) : (
            <Clock size={16} />
          )}
          <span>Access expires in</span>
        </div>
        <div className="flex items-center gap-3">
          {timeFormatted.split(':').map((unit, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <span className="text-2xl font-bold text-gray-600">:</span>
              )}
              <motion.div
                className={`relative px-4 py-3 rounded-xl font-mono text-3xl font-bold ${
                  isCritical
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : isUrgent
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-white/5 text-white border border-white/10'
                }`}
                key={`${index}-${unit}`}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                {unit}
              </motion.div>
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center gap-6 text-xs text-gray-500 font-medium uppercase tracking-wider">
          <span className="w-16 text-center">Hours</span>
          <span className="w-16 text-center">Minutes</span>
          <span className="w-16 text-center">Seconds</span>
        </div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
        isCritical
          ? 'bg-red-500/10 border-red-500/20 text-red-400'
          : isUrgent
          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          : 'bg-white/5 border-white/10 text-gray-300'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {isCritical ? (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <AlertTriangle size={16} />
        </motion.div>
      ) : (
        <Clock size={16} />
      )}
      <span className="text-sm font-medium">Expires in</span>
      <span className="font-mono font-bold text-sm">{timeFormatted}</span>
    </motion.div>
  );
};

export default CountdownTimer;
