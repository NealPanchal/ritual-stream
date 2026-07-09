/**
 * /watch — Protected Streaming Hub
 *
 * Accessible only to users with a valid 24-hour pass.
 * Shows access status, countdown timer, and redirects to main content.
 */

'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Clock,
  Shield,
  Film,
  Tv,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import AccessGate from '@/components/AccessGate';
import CountdownTimer from '@/components/CountdownTimer';
import AccessBadge from '@/components/AccessBadge';
import WalletConnect from '@/components/WalletConnect';
import Logo from '@/components/Logo';
import { useAccess } from '@/hooks/useAccess';
import { shortenAddress } from '@/lib/blockchain';

// ============================================================================
// Content categories for the streaming hub
// ============================================================================

const categories = [
  {
    title: 'Movies',
    description: 'Thousands of titles across every genre',
    icon: Film,
    href: '/movies',
    gradient: 'from-base-blue/20 to-blue-600/5',
  },
  {
    title: 'TV Shows',
    description: 'Binge-worthy series and originals',
    icon: Tv,
    href: '/tv',
    gradient: 'from-purple-500/20 to-purple-700/5',
  },
  {
    title: 'Trending',
    description: "What everyone's watching right now",
    icon: Sparkles,
    href: '/',
    gradient: 'from-emerald-500/20 to-emerald-700/5',
  },
];

// ============================================================================
// Page Component (wrapped in AccessGate)
// ============================================================================

function WatchContent() {
  const router = useRouter();
  const { hasAccess, timeRemaining, timeFormatted, accessData } = useAccess(true);

  return (
    <div className="min-h-screen bg-base-black text-white">
      {/* Header */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#00F5A0]/10 border border-[#00F5A0]/30 shadow-lg shadow-[#00F5A0]/20">
            <Logo size={24} color="#00F5A0" />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-white font-extrabold text-[19px] tracking-[-0.03em]">
              Ritual<span className="text-[#00F5A0]">Stream</span>
            </span>
            <span className="text-[10px] text-gray-500 font-medium tracking-[0.15em] uppercase mt-[2px]">
              Ritual Network
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <AccessBadge
            timeRemaining={timeRemaining}
            timeFormatted={timeFormatted}
            variant="compact"
          />
          <WalletConnect compact />
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        {/* Welcome section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-6"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Shield size={14} />
            <span>24-Hour Pass Active</span>
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-black mb-4">
            Welcome to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-base-blue to-blue-400">
              BaseStream
            </span>
          </h1>
          <p className="text-gray-400 max-w-md mx-auto">
            Your 24-hour pass is active. Enjoy unlimited streaming across our entire library.
          </p>

          {/* Wallet info */}
          {accessData?.walletAddress && (
            <p className="mt-4 text-xs text-gray-600 font-mono">
              Wallet: {shortenAddress(accessData.walletAddress)}
            </p>
          )}
        </motion.div>

        {/* Countdown timer */}
        <motion.div
          className="flex justify-center mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <CountdownTimer
            timeRemaining={timeRemaining}
            timeFormatted={timeFormatted}
            variant="large"
          />
        </motion.div>

        {/* Browse categories */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-xl font-bold text-gray-300 text-center mb-8">
            Start Watching
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {categories.map((cat, index) => (
              <motion.button
                key={cat.title}
                onClick={() => router.push(cat.href)}
                className={`group relative p-6 rounded-2xl bg-gradient-to-br ${cat.gradient} border border-white/[0.06] hover:border-white/15 transition-all duration-300 text-left overflow-hidden`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center mb-4 group-hover:bg-white/10 transition-all">
                    <cat.icon size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {cat.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    {cat.description}
                  </p>
                  <div className="flex items-center gap-2 text-base-blue text-sm font-semibold group-hover:gap-3 transition-all">
                    <span>Browse</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Quick play CTA */}
        <motion.div
          className="flex justify-center mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <motion.button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-base-blue to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-base-blue/30 hover:shadow-base-blue/50 transition-all"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Play size={20} fill="white" />
            <span>Go to Home</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

// Wrap with AccessGate for protection
export default function WatchPage() {
  return (
    <AccessGate>
      <WatchContent />
    </AccessGate>
  );
}
