'use client';

/**
 * OTTFilterRow.tsx — Cineby-style OTT provider content row
 *
 * Renders a ContentRow whose data source is driven by a provider
 * dropdown. Clicking the row label opens a glassmorphism picker
 * listing Netflix, Prime, Max, Disney+, Apple TV+, Paramount+, Hulu.
 *
 * Selecting a provider:
 *  - Swaps the row's TMDB data to that provider's content
 *  - Updates the label: "Only on Netflix" → "Trending on Max" etc.
 *  - Closes the dropdown with a smooth animation
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { OTT_PROVIDERS, OTTProviderKey } from '@/lib/tmdb-config';
import { useProviderMovies, useProviderTV } from '@/lib/tmdb';
import ContentRow from './ContentRow';

// ─── Provider letter badge ─────────────────────────────────────────────────────
function ProviderBadge({ letter, color, size = 20 }: { letter: string; color: string; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded font-black text-white flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.45,
        lineHeight: 1,
      }}
    >
      {letter}
    </span>
  );
}

// ─── Row label prefix map ──────────────────────────────────────────────────────
const ROW_LABEL_PREFIX: Record<OTTProviderKey, string> = {
  Netflix:   'Only on Netflix',
  Prime:     'Prime Video Picks',
  Disney:    'Disney+ Originals',
  Max:       'Trending on Max',
  AppleTV:   'Apple TV+ Exclusives',
  Paramount: 'On Paramount+',
  Hulu:      'Streaming on Hulu',
};

// ─── Props ─────────────────────────────────────────────────────────────────────
interface OTTFilterRowProps {
  defaultProvider?: OTTProviderKey;
  mediaType?: 'movie' | 'tv';
}

// ─── Component ─────────────────────────────────────────────────────────────────
const OTTFilterRow = ({
  defaultProvider = 'Netflix',
  mediaType = 'movie',
}: OTTFilterRowProps) => {
  const [activeKey, setActiveKey]   = useState<OTTProviderKey>(defaultProvider);
  const [dropOpen,  setDropOpen]    = useState(false);
  const dropRef                     = useRef<HTMLDivElement>(null);

  const provider = OTT_PROVIDERS[activeKey];

  // Fetch content for active provider
  const { data: movieData, isLoading: movLoading } = useProviderMovies(
    provider.id, mediaType === 'movie'
  );
  const { data: tvData, isLoading: tvLoading } = useProviderTV(
    provider.id, mediaType === 'tv'
  );

  const items   = mediaType === 'movie'
    ? movieData?.results ?? []
    : tvData?.results ?? [];
  const loading = mediaType === 'movie' ? movLoading : tvLoading;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectProvider = (key: OTTProviderKey) => {
    setActiveKey(key);
    setDropOpen(false);
  };

  return (
    <div className="relative">
      {/* ── Custom row header with dropdown trigger ── */}
      <div className="flex items-center justify-between mb-4 px-0.5">
        <div ref={dropRef} className="relative">
          {/* Trigger button */}
          <button
            onClick={() => setDropOpen(o => !o)}
            className="flex items-center gap-2 group"
          >
            {/* Red accent bar (matches Cineby's red left-bar) */}
            <span
              className="w-1 h-4 rounded-full flex-shrink-0"
              style={{ background: 'var(--accent)' }}
            />
            <ProviderBadge letter={provider.letter} color={provider.color} size={18} />
            <span
              className="text-xs font-bold tracking-[0.12em] uppercase transition-colors"
              style={{
                color: 'var(--text-primary)',
                fontFamily: '"DM Sans", system-ui, sans-serif',
              }}
            >
              {ROW_LABEL_PREFIX[activeKey]}
            </span>
            <motion.span
              animate={{ rotate: dropOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-gray-500 group-hover:text-white transition-colors"
            >
              <ChevronDown size={14} />
            </motion.span>
          </button>

          {/* ── Glassmorphism dropdown ── */}
          <AnimatePresence>
            {dropOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{   opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute left-0 top-full mt-2 z-50 min-w-[190px] rounded-xl overflow-hidden"
                style={{
                  background:    'rgba(18,18,18,0.92)',
                  backdropFilter: 'blur(20px)',
                  border:        '1px solid rgba(255,255,255,0.10)',
                  boxShadow:     '0 16px 40px rgba(0,0,0,0.7)',
                }}
              >
                {(Object.keys(OTT_PROVIDERS) as OTTProviderKey[]).map(key => {
                  const p       = OTT_PROVIDERS[key];
                  const isActive = key === activeKey;
                  return (
                    <button
                      key={key}
                      onClick={() => selectProvider(key)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                        color:      isActive ? '#ffffff' : 'rgba(255,255,255,0.65)',
                      }}
                      onMouseEnter={e => {
                        if (!isActive)
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                      }}
                      onMouseLeave={e => {
                        if (!isActive)
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }}
                    >
                      <ProviderBadge letter={p.letter} color={p.color} size={22} />
                      <span
                        className="text-sm font-medium"
                        style={{ fontFamily: '"DM Sans", sans-serif' }}
                      >
                        {p.label}
                      </span>
                      {isActive && (
                        <span
                          className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: p.color }}
                        />
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Content strip — reuses ContentRow's scroll/arrow logic but skips its own header ── */}
      <ContentRow
        title=""          /* header rendered above */
        items={items}
        loading={loading}
        hideHeader
      />
    </div>
  );
};

export default OTTFilterRow;
