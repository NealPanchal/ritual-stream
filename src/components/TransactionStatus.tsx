/**
 * TransactionStatus.tsx — Transaction lifecycle overlay
 *
 * Full-screen overlay showing transaction progress:
 * Sending → Confirming → Success → Error
 *
 * Provides visual feedback during the payment flow.
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { PAYMENT_AMOUNT_ETH } from '@/lib/blockchain';

export type TransactionState = 'idle' | 'sending' | 'confirming' | 'success' | 'error';

interface TransactionStatusProps {
  /** Current state of the transaction */
  state: TransactionState;
  /** Transaction hash (available after sending) */
  txHash?: string;
  /** Error message if state is 'error' */
  errorMessage?: string;
  /** Callback when user dismisses the overlay */
  onDismiss?: () => void;
  /** Callback when user wants to retry */
  onRetry?: () => void;
}

const TransactionStatus: React.FC<TransactionStatusProps> = ({
  state,
  txHash,
  errorMessage,
  onDismiss,
  onRetry,
}) => {
  if (state === 'idle') return null;

  const baseScanUrl = txHash ? `https://explorer.ritualfoundation.org/tx/${txHash}` : null;

  return (
    <AnimatePresence>
      <motion.div
        key="transaction-status-overlay"
        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-md mx-4 p-6 sm:p-8 bg-base-gray border border-white/10 rounded-3xl shadow-2xl"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* Sending State */}
          {state === 'sending' && (
            <motion.div
              className="flex flex-col items-center text-center gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 size={56} className="text-[#00F5A0]" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Confirm in Wallet
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Please confirm the transaction in your wallet. Do not close this page.
                </p>
              </div>
              <div className="w-full bg-base-gray-light rounded-xl p-4 border border-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount</span>
                  <span className="text-white font-mono font-semibold">{PAYMENT_AMOUNT_ETH} RITUAL</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">Network</span>
                  <span className="text-[#00F5A0] font-medium">Ritual Chain</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Confirming State */}
          {state === 'confirming' && (
            <motion.div
              className="flex flex-col items-center text-center gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="relative">
                <motion.div
                  className="w-16 h-16 rounded-full border-4 border-[#00F5A0]/30 border-t-[#00F5A0]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#00F5A0]/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#00F5A0]">⛓</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Confirming on Ritual Chain
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Your transaction is being confirmed on-chain. This usually takes a few seconds.
                </p>
              </div>
              {baseScanUrl && (
                <a
                  href={baseScanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#00F5A0] hover:text-[#00c87f] transition-colors"
                >
                  <span>View on Ritual Explorer</span>
                  <ExternalLink size={14} />
                </a>
              )}
            </motion.div>
          )}

          {/* Success State */}
          {state === 'success' && (
            <motion.div
              className="flex flex-col items-center text-center gap-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 size={48} className="text-emerald-400" />
                </div>
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Access Unlocked! 🎉
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  You now have 24 hours of unlimited streaming. Enjoy!
                </p>
              </div>
              {baseScanUrl && (
                <a
                  href={baseScanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <span>View transaction</span>
                  <ExternalLink size={14} />
                </a>
              )}
              <motion.button
                onClick={onDismiss}
                className="w-full py-3.5 bg-[#00F5A0] hover:bg-[#00c87f] text-black font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-[#00F5A0]/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Watching
              </motion.button>
            </motion.div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <motion.div
              className="flex flex-col items-center text-center gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle size={48} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Transaction Failed
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {errorMessage || 'Something went wrong with the transaction. Please try again.'}
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <motion.button
                  onClick={onDismiss}
                  className="flex-1 py-3 bg-white/5 border border-white/10 text-gray-300 font-medium rounded-xl hover:bg-white/10 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={onRetry}
                  className="flex-1 py-3 bg-[#00F5A0] hover:bg-[#00c87f] text-black font-semibold rounded-xl transition-all shadow-lg shadow-[#00F5A0]/20"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Try Again
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TransactionStatus;
