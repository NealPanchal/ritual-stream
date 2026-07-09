'use client';

/**
 * src/components/player/SettingsPanel.tsx
 *
 * Consolidated settings panel: subtitle style, sync offset.
 * Glassmorphism panel matching premium OTT design.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import type { SubtitleStyle } from '@/lib/player-prefs';

interface SettingsPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const FONT_SIZE_OPTIONS: { value: SubtitleStyle['fontSize']; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'xl', label: 'Extra Large' },
];

const BG_OPACITY_OPTIONS: { value: SubtitleStyle['bgOpacity']; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export const SettingsPanel = memo(function SettingsPanel({
  isOpen,
  onToggle,
  onClose,
}: SettingsPanelProps) {
  const {
    subtitleStyle, subtitleEnabled,
    setSubtitleStyle, nudgeSync, syncOffsetMs,
  } = usePlayerStore();

  return (
    <>
      {/* Settings button */}
      <button
        onClick={onToggle}
        aria-label="Settings"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all"
        style={{
          background:    'rgba(0,0,0,0.65)',
          backdropFilter:'blur(12px)',
          border:        isOpen ? '1px solid rgba(0,82,255,0.60)' : '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <Settings size={13} color={isOpen ? '#0052FF' : 'rgba(255,255,255,0.75)'} />
        <span className="text-xs font-bold text-white">Settings</span>
      </button>

      {/* Settings dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-full top-0 mr-3 w-[260px] rounded-[18px] bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/[0.04] shadow-2xl p-3 z-[100]"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
              <span className="text-white text-[13px] font-semibold">Settings</span>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* Subtitle settings — only shown when subtitles are enabled */}
            {subtitleEnabled && (
              <div className="space-y-4">
                {/* Font Size */}
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block mb-2">
                    Subtitle Size
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {FONT_SIZE_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setSubtitleStyle({ fontSize: value })}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                          subtitleStyle.fontSize === value
                            ? 'bg-[#0052ff]/15 text-[#3b82f6] border border-[#0052ff]/25'
                            : 'text-gray-400 hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Opacity */}
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block mb-2">
                    Background
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {BG_OPACITY_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setSubtitleStyle({ bgOpacity: value })}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                          subtitleStyle.bgOpacity === value
                            ? 'bg-[#0052ff]/15 text-[#3b82f6] border border-[#0052ff]/25'
                            : 'text-gray-400 hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block mb-2">
                    Text Color
                  </label>
                  <div className="flex gap-2">
                    {(['white', 'yellow'] as const).map((color) => (
                      <button
                        key={color}
                        onClick={() => setSubtitleStyle({ color })}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                          subtitleStyle.color === color
                            ? 'bg-[#0052ff]/15 text-[#3b82f6] border border-[#0052ff]/25'
                            : 'text-gray-400 hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        {color === 'white' ? '⬜ White' : '🟨 Yellow'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sync offset */}
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block mb-2">
                    Sync Offset ({syncOffsetMs > 0 ? '+' : ''}{(syncOffsetMs / 1000).toFixed(1)}s)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => nudgeSync(-500)}
                      className="flex-1 py-1.5 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors flex items-center justify-center"
                    >
                      <ChevronLeft size={14} />
                      <span className="text-[11px] font-semibold">-0.5s</span>
                    </button>
                    <button
                      onClick={() => nudgeSync(500)}
                      className="flex-1 py-1.5 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors flex items-center justify-center"
                    >
                      <span className="text-[11px] font-semibold">+0.5s</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!subtitleEnabled && (
              <p className="text-gray-600 text-[12px] text-center py-4">
                Enable subtitles to access subtitle settings.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});
