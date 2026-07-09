'use client';

/**
 * src/components/player/PlayerControls.tsx
 *
 * Minimal glassmorphism control bar at the bottom of the player.
 * Fades out on mouse idle, reappears on mouse move.
 *
 * Controls:
 *  - Audio language selector (via AudioSelector)
 *  - CC / Subtitles toggle
 *  - Server selector
 *  - Settings panel (subtitle customization)
 *
 * All debug-like overlays, provider badges, and status indicators removed.
 */

import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Subtitles, Server, Check } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import type { SubtitleStatus } from '@/lib/subtitle-engine';
import { PROVIDER_ROSTER, PROVIDER_LABELS } from '@/lib/providers';
import type { ProviderId, ProviderHealth } from '@/lib/providers';
import { AudioSelector } from './AudioSelector';
import { SettingsPanel } from './SettingsPanel';

interface PlayerControlsProps {
  subtitleStatus: SubtitleStatus;
  currentProvider?: ProviderId;
  providerHealth?: Partial<Record<ProviderId, ProviderHealth>>;
  switchProvider?: (p: ProviderId) => void;
  isIdle: boolean;
}

export const PlayerControls = memo(function PlayerControls({
  subtitleStatus,
  currentProvider,
  providerHealth,
  switchProvider,
  isIdle,
}: PlayerControlsProps) {
  const {
    audioLang, subtitleEnabled, setAudioLang, setSubtitleEnabled,
  } = usePlayerStore();

  const [activeDropdown, setActiveDropdown] = useState<'audio' | 'subtitles' | 'servers' | 'settings' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!activeDropdown) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [activeDropdown]);

  return (
    <AnimatePresence>
      {!isIdle && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-6 left-6 flex items-center gap-3 z-50 pointer-events-auto"
        >
          {/* Server Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'servers' ? null : 'servers')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
              style={{
                background:    'rgba(0,0,0,0.65)',
                backdropFilter:'blur(12px)',
                border:        activeDropdown === 'servers' ? '1px solid rgba(0,82,255,0.60)' : '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <Server size={13} color={activeDropdown === 'servers' ? '#0052FF' : 'rgba(255,255,255,0.75)'} />
              <span className="text-xs font-bold text-white">
                {currentProvider ? PROVIDER_LABELS[currentProvider] || currentProvider : 'Server'}
              </span>
            </button>
            
            <AnimatePresence>
              {activeDropdown === 'servers' && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute bottom-full left-0 mb-3 w-[180px] rounded-[18px] bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/[0.04] shadow-2xl p-2 z-[100] flex flex-col gap-1"
                >
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-2 border-b border-white/5 pb-2">Select Server</div>
                  {PROVIDER_ROSTER.map(provider => (
                    <button
                      key={provider}
                      onClick={() => {
                        switchProvider?.(provider);
                        setActiveDropdown(null);
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        currentProvider === provider ? 'bg-[#0052ff]/15 text-[#3b82f6] border border-[#0052ff]/25' : 'text-gray-300 hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      {PROVIDER_LABELS[provider] || provider}
                      {currentProvider === provider && <Check size={14} className="text-[#3b82f6]" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Settings Panel */}
          <div className="relative">
            <SettingsPanel 
              isOpen={activeDropdown === 'settings'} 
              onToggle={() => setActiveDropdown(activeDropdown === 'settings' ? null : 'settings')}
              onClose={() => setActiveDropdown(null)}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
