'use client';

/**
 * src/components/player/SubtitleOverlay.tsx
 *
 * Renders the active subtitle cue as a styled HTML div positioned
 * absolutely over the iframe player. Uses requestAnimationFrame to
 * poll the estimated playback position and update the active cue.
 *
 * Since we cannot read the iframe's currentTime, we maintain an
 * estimated position = (timestamp when play clicked) + elapsed wall-clock time.
 */

import { useEffect, useRef, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SubtitleCue, getCueAt } from '@/lib/subtitle-engine';
import { usePlayerStore } from '@/store/playerStore';
import { FONT_SIZE_MAP, BG_OPACITY_MAP } from '@/lib/player-prefs';

interface SubtitleOverlayProps {
  cues:       SubtitleCue[];
  /** Call this to register the "play started at" timestamp */
  playStartMs: number | null;
}

export const SubtitleOverlay = memo(function SubtitleOverlay({ cues, playStartMs }: SubtitleOverlayProps) {
  const { subtitleEnabled, subtitleStyle, syncOffsetMs, isPlaying } = usePlayerStore();
  const [activeCue, setActiveCue] = useState<SubtitleCue | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!subtitleEnabled || cues.length === 0 || playStartMs === null) {
      setActiveCue(null);
      return;
    }

    const tick = () => {
      if (!isPlaying) return;
      const elapsed = performance.now() - playStartMs;
      const cue = getCueAt(cues, elapsed, syncOffsetMs);
      setActiveCue(cue);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [subtitleEnabled, cues, playStartMs, syncOffsetMs, isPlaying]);

  if (!subtitleEnabled) return null;

  const { fontSize, bgOpacity, color, position } = subtitleStyle;
  const isBottom = position === 'bottom';

  return (
    <div
      aria-live="polite"
      aria-label="Subtitles"
      className="absolute left-0 right-0 flex justify-center pointer-events-none"
      style={{
        zIndex:   5,
        bottom:   isBottom ? '10%' : 'auto',
        top:      isBottom ? 'auto' : '8%',
        padding: '0 8%',
      }}
    >
      <AnimatePresence mode="wait">
        {activeCue && (
          <motion.div
            key={activeCue.startMs}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-center px-3 py-1.5 rounded-lg"
            style={{
              fontSize:        FONT_SIZE_MAP[fontSize],
              background:      BG_OPACITY_MAP[bgOpacity],
              color:           color === 'yellow' ? '#facc15' : '#ffffff',
              textShadow:      bgOpacity === 'none' ? '0 1px 4px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.8)' : 'none',
              fontWeight:      600,
              lineHeight:      1.45,
              letterSpacing:   '0.01em',
              whiteSpace:      'pre-wrap',
              maxWidth:        '80%',
              fontFamily:      '"DM Sans", system-ui, sans-serif',
            }}
          >
            {activeCue.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
