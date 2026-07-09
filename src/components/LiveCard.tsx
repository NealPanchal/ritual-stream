'use client';

/**
 * LiveCard.tsx — Live sports/event stream card
 *
 * 16:9 thumbnail with:
 * - Pulsing red LIVE badge (top-left)
 * - Event title + sport category (below)
 * - Stream quality badge (top-right)
 * - Hover: glow border + scale + play overlay
 * - Click: navigate to /live/[id]
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Wifi } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface LiveEvent {
  id: string;
  title: string;
  sport: string;
  thumbnail: string;   // TMDB image path or full URL
  quality: 'HD' | 'FHD' | '4K';
  viewers?: number;
  isLive: boolean;
  embedUrl?: string;
  league?: string;
}

// ─── Pulsing LIVE badge ───────────────────────────────────────────────────────
function LiveBadge() {
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest"
      style={{
        background: 'rgba(220,38,38,0.85)',
        backdropFilter: 'blur(4px)',
        color: '#fff',
        fontFamily: '"Space Mono", monospace',
      }}
    >
      {/* Pulsing dot */}
      <span className="relative flex h-1.5 w-1.5">
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
          style={{ background: '#fff' }}
        />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
      </span>
      LIVE
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const LiveCard = ({ event }: { event: LiveEvent }) => {
  const router   = useRouter();
  const [hovered, setHovered] = useState(false);

  const thumbSrc = event.thumbnail.startsWith('http')
    ? event.thumbnail
    : `https://image.tmdb.org/t/p/w500${event.thumbnail}`;

  const formatViewers = (n?: number) => {
    if (!n) return null;
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
  };

  return (
    <motion.div
      className="flex-shrink-0 cursor-pointer"
      style={{ width: '240px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => router.push(`/live/${event.id}`)}
      whileHover={{ scale: 1.04 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {/* ── Thumbnail ── */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: '16/9',
          borderRadius: '8px',
          boxShadow: hovered
            ? '0 0 0 2px #dc2626, 0 8px 30px rgba(220,38,38,0.35)'
            : '0 4px 16px rgba(0,0,0,0.55)',
          transition: 'box-shadow 0.2s ease',
          background: '#1c1c1c',
        }}
      >
        <img
          src={thumbSrc}
          alt={event.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              'https://placehold.co/240x135/1c1c1c/444?text=LIVE';
          }}
        />

        {/* Dark overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: hovered
              ? 'rgba(0,0,0,0.25)'
              : 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)',
          }}
        />

        {/* LIVE badge — top left */}
        <div className="absolute top-2 left-2">
          {event.isLive ? <LiveBadge /> : (
            <div
              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
              style={{
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                color: 'rgba(255,255,255,0.6)',
                fontFamily: '"Space Mono", monospace',
              }}
            >
              Soon
            </div>
          )}
        </div>

        {/* Quality badge — top right */}
        <div
          className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold"
          style={{
            border: '1px solid rgba(255,255,255,0.25)',
            color: 'rgba(255,255,255,0.70)',
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            fontFamily: '"Space Mono", monospace',
          }}
        >
          {event.quality}
        </div>

        {/* Play button on hover */}
        {hovered && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(220,38,38,0.85)',
                backdropFilter: 'blur(4px)',
                boxShadow: '0 0 20px rgba(220,38,38,0.6)',
              }}
            >
              <Play size={20} fill="white" color="white" />
            </div>
          </motion.div>
        )}

        {/* Viewer count — bottom left */}
        {formatViewers(event.viewers) && (
          <div
            className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px]"
            style={{ color: 'rgba(255,255,255,0.75)', fontFamily: '"Space Mono", monospace' }}
          >
            <Wifi size={9} />
            {formatViewers(event.viewers)}
          </div>
        )}
      </div>

      {/* ── Meta below thumbnail ── */}
      <div className="mt-2 px-0.5">
        <h3
          className="font-semibold text-sm leading-snug line-clamp-2 text-white"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          {event.title}
        </h3>
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className="text-[10px] uppercase font-bold"
            style={{ color: '#dc2626', fontFamily: '"Space Mono", monospace' }}
          >
            {event.isLive ? 'Live' : 'Starting Soon'}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
          <span
            className="text-[10px] capitalize"
            style={{ color: 'rgba(255,255,255,0.45)', fontFamily: '"DM Sans", sans-serif' }}
          >
            {event.sport}{event.league ? ` · ${event.league}` : ''}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default LiveCard;
