/**
 * WalletConnect.tsx — Custom wallet connection button
 *
 * Wraps RainbowKit's ConnectButton with Ritual-branded styling.
 * Shows wallet address, network status, and switch-network prompt.
 */

'use client';

import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import { Wallet, AlertTriangle, ChevronDown } from 'lucide-react';

interface WalletConnectProps {
  /** Show compact version (just address + avatar) */
  compact?: boolean;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ compact = false }) => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              // Not connected → show connect button
              if (!connected) {
                return (
                  <motion.button
                    onClick={openConnectModal}
                    className="flex items-center gap-3 px-6 py-3 bg-[#00F5A0] hover:bg-[#00c87f] text-black font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-[#00F5A0]/20 hover:shadow-[#00F5A0]/40"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Wallet size={20} />
                    <span>Connect Wallet</span>
                  </motion.button>
                );
              }

              // Wrong chain → show switch network
              if (chain.unsupported) {
                return (
                  <motion.button
                    onClick={openChainModal}
                    className="flex items-center gap-3 px-6 py-3 bg-red-500/20 border border-red-500/40 text-red-400 font-semibold rounded-xl hover:bg-red-500/30 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <AlertTriangle size={20} />
                    <span>Switch to Ritual Chain</span>
                  </motion.button>
                );
              }

              // Connected on correct chain
              if (compact) {
                return (
                  <motion.button
                    onClick={openAccountModal}
                    className="flex items-center gap-2 px-4 py-2 bg-base-gray-light border border-white/10 rounded-xl hover:border-white/20 transition-all"
                    whileHover={{ scale: 1.02 }}
                  >
                    {/* Chain icon */}
                    <div className="w-5 h-5 rounded-full bg-[#00F5A0]/10 border border-[#00F5A0]/30 flex items-center justify-center">
                      <span className="text-[10px] font-black text-[#00F5A0]">R</span>
                    </div>
                    <span className="text-sm font-medium text-white">
                      {account.displayName}
                    </span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </motion.button>
                );
              }

              return (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Network badge */}
                  <motion.button
                    onClick={openChainModal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-base-gray-light border border-white/10 rounded-xl hover:border-[#00F5A0]/30 transition-all"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="w-5 h-5 rounded-full bg-[#00F5A0]/10 border border-[#00F5A0]/30 flex items-center justify-center">
                      <span className="text-[10px] font-black text-[#00F5A0]">R</span>
                    </div>
                    <span className="text-sm font-medium text-gray-300">
                      {chain.name}
                    </span>
                  </motion.button>

                  {/* Account button */}
                  <motion.button
                    onClick={openAccountModal}
                    className="flex items-center gap-3 px-5 py-2.5 bg-base-gray-light border border-white/10 rounded-xl hover:border-[#00F5A0]/30 transition-all"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#00F5A0] to-[#00c87f] flex items-center justify-center">
                      <Wallet size={12} className="text-white" />
                    </div>
                    <span className="text-sm font-medium text-white">
                      {account.displayName}
                    </span>
                    {account.displayBalance && (
                      <span className="text-xs text-gray-500 hidden sm:block">
                        {account.displayBalance}
                      </span>
                    )}
                  </motion.button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default WalletConnect;
