'use client';

/**
 * src/components/player/AudioSelector.tsx
 *
 * Extracted audio language selector with glassmorphism dropdown.
 * Only renders when audio tracks are conceptually available.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Check } from 'lucide-react';
import { AUDIO_LANGUAGES } from '@/lib/player-prefs';

interface AudioSelectorProps {
  audioLang: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (lang: string) => void;
}

export const AudioSelector = memo(function AudioSelector({
  audioLang,
  isOpen,
  onToggle,
  onSelect,
}: AudioSelectorProps) {
  const audioLabel = AUDIO_LANGUAGES.find(l => l.code === audioLang);

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        aria-label={`Audio: ${audioLabel?.label ?? audioLang}`}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all"
        style={{
          background:    'rgba(0,0,0,0.65)',  
          backdropFilter:'blur(12px)',
          border:        isOpen ? '1px solid rgba(0,82,255,0.60)' : '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <Volume2 size={13} color={isOpen ? '#0052FF' : 'rgba(255,255,255,0.75)'} />
        <span className="text-xs font-bold text-white">
          {audioLabel?.flag ?? '🔊'} {audioLang.toUpperCase()}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-full top-0 ml-3 w-[220px] rounded-[18px] bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/[0.04] shadow-2xl p-2 z-[100]"
          >
            <div className="px-3 pt-2 pb-3 flex items-center justify-between border-b border-white/5 mb-2">
              <span className="text-white text-[13px] font-semibold">Audio Language</span>
            </div>
            <div className="flex flex-col gap-1 max-h-[260px] overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
              {AUDIO_LANGUAGES.map((lang) => {
                const isCurrent = lang.code === audioLang;
                return (
                  <button
                    key={lang.code}
                    onClick={() => onSelect(lang.code)}
                    className={`
                      flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-all text-left
                      ${isCurrent
                        ? 'bg-[#0052ff]/10 border border-[#0052ff]/20'
                        : 'bg-transparent border border-transparent hover:bg-white/5'
                      }
                    `}
                  >
                    <div className={`text-[13px] font-semibold ${isCurrent ? 'text-[#3b82f6]' : 'text-white'}`}>
                      {lang.flag} {lang.label}
                    </div>
                    {isCurrent && <Check size={14} className="text-[#3b82f6]" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
