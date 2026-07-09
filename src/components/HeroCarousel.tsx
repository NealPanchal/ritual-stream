'use client';

/**
 * HeroCarousel.tsx — Cinematic hero spotlight carousel
 *
 * Full-width backdrop with:
 * - Animated film-grain texture
 * - Bottom-bleed gradient into content rows
 * - Genre tag pills, rating badge, metadata row
 * - Two CTA buttons: ▶ Watch Now + ＋ Watchlist
 * - Staggered text entrance animation
 * - Auto-advance every 6 s, pauses on hover
 * - YouTube trailer background (muted, no controls)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, ChevronLeft, ChevronRight, Star, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Movie } from '@/types';

// ─── Genre ID → name map (top-200 TMDB genres) ──────────────────────────────
const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
};

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

interface HeroCarouselProps {
  items: Movie[];
  onPlay?: (movie: Movie) => void;
}

// ─── Animation variants ───────────────────────────────────────────────────────
// NOTE: We keep variants intentionally simple (no transition inside the object)
// and pass `transition` directly on each motion element to avoid TS conflicts
// with Framer Motion's Variants index signature.
const backdropVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit:  { opacity: 0 },
};

// Content items animate via direct initial/animate props + custom delay,
// so no top-level Variants needed here.

// ─── Component ────────────────────────────────────────────────────────────────
const HeroCarousel = ({ items, onPlay }: HeroCarouselProps) => {
  const [activeIndex, setActiveIndex]   = useState(0);
  const [direction,   setDirection]     = useState(0);
  const [trailerKey,  setTrailerKey]    = useState<string | null>(null);
  const [trailerReady, setTrailerReady] = useState(false);
  const [isPaused,     setIsPaused]     = useState(false);

  const router       = useRouter();
  const intervalRef  = useRef<NodeJS.Timeout | null>(null);
  const activeItem   = items[activeIndex];

  // ── Auto-advance ────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDirection(1);
      setActiveIndex(prev => (prev + 1) % items.length);
    }, 6000);
  }, [items.length]);

  useEffect(() => {
    if (!isPaused) startTimer();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPaused, startTimer]);

  // ── Navigation helpers ──────────────────────────────────────────────────────
  const go = (dir: 1 | -1) => {
    setDirection(dir);
    setActiveIndex(prev => (prev + dir + items.length) % items.length);
    startTimer();
  };

  // ── Trailer fetch ────────────────────────────────────────────────────────────
  useEffect(() => {
    setTrailerKey(null);
    setTrailerReady(false);
    if (!activeItem?.id || !TMDB_API_KEY) return;

    const timer = setTimeout(async () => {
      try {
        const res  = await fetch(
          `https://api.themoviedb.org/3/movie/${activeItem.id}/videos?api_key=${TMDB_API_KEY}&language=en-US`
        );
        const data = await res.json();
        const clip = data.results?.find(
          (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
        );
        if (clip) setTrailerKey(clip.key);
      } catch { /* silent */ }
    }, 1800);

    return () => clearTimeout(timer);
  }, [activeItem?.id]);

  if (!items?.length) return null;

  const genres = (activeItem.genre_ids ?? [])
    .slice(0, 3)
    .map(id => GENRE_MAP[id])
    .filter(Boolean);

  const year = activeItem.release_date
    ? new Date(activeItem.release_date).getFullYear()
    : null;

  const rating = activeItem.vote_average?.toFixed(1);

  const runtime = (activeItem as any).runtime as number | undefined;
  const runtimeStr = runtime
    ? `${Math.floor(runtime / 60)}h ${runtime % 60}m`
    : null;

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: 'clamp(480px, 88vh, 860px)' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── Background layer ─────────────────────────────────────────── */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={activeIndex}
          className="absolute inset-0"
          variants={backdropVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.9, ease: 'easeInOut' }}
        >
          {/* Backdrop image */}
          <Image
            src={activeItem.backdrop_path ? `https://image.tmdb.org/t/p/original${activeItem.backdrop_path}` : '/placeholder-backdrop.jpg'}
            alt={activeItem.title}
            fill
            priority={activeIndex === 0}
            className="object-cover object-center md:object-top"
            sizes="100vw"
          />

          {/* Muted YouTube trailer (overlays the static image once ready) */}
          {trailerKey && (
            <div className="absolute inset-0 pointer-events-none scale-[1.08] origin-center">
              <iframe
                key={trailerKey}
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&loop=1&playlist=${trailerKey}&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1`}
                className={`w-full h-full border-0 transition-opacity duration-1000 ${trailerReady ? 'opacity-100' : 'opacity-0'}`}
                allow="autoplay; encrypted-media"
                onLoad={() => setTrailerReady(true)}
                title="trailer"
              />
            </div>
          )}

          {/* Film-grain animated texture */}
          <div className="grain-overlay" />

          {/* Gradient stack: left vignette + bottom bleed */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent" />
          {/* Top vignette */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* ── Content overlay ──────────────────────────────────────────── */}
      <div className="relative h-full flex flex-col justify-end pb-24 md:pb-28 px-6 md:px-12 lg:px-16 max-w-[1800px] mx-auto"
        style={{ zIndex: 10 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            className="max-w-2xl xl:max-w-3xl"
          >
            {/* Genre pills */}
            {genres.length > 0 && (
              <motion.div
                className="flex flex-wrap gap-2 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.55, ease: 'easeOut' }}
              >
                {genres.map(g => (
                  <span
                    key={g}
                    className="text-[11px] font-medium tracking-wide px-3 py-1 rounded-full border"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      borderColor: 'rgba(255,255,255,0.10)',
                      color: 'var(--text-secondary)',
                      fontFamily: '"DM Sans", sans-serif',
                    }}
                  >
                    {g}
                  </span>
                ))}
              </motion.div>
            )}

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.55, ease: 'easeOut' }}
              className="font-black leading-[1.05] mb-4 drop-shadow-2xl"
              style={{
                fontSize: 'clamp(2rem, 5.5vw, 4.5rem)',
                letterSpacing: '-0.02em',
                fontFamily: '"DM Sans", system-ui, sans-serif',
              }}
            >
              {activeItem.title}
            </motion.h1>

            {/* Metadata strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.33, duration: 0.55, ease: 'easeOut' }}
              className="flex items-center flex-wrap gap-3 mb-5"
            >
              {/* Rating badge */}
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold"
                style={{
                  background: 'rgba(0, 82, 255, 0.15)',
                  border: '1px solid rgba(0, 82, 255, 0.40)',
                  color: '#6ba3ff',
                  fontFamily: '"Space Mono", monospace',
                }}
              >
                <Star size={10} fill="currentColor" />
                {rating}
              </span>

              {year && (
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {year}
                </span>
              )}

              {runtimeStr && (
                <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <Clock size={13} />
                  {runtimeStr}
                </span>
              )}

              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded border"
                style={{
                  borderColor: 'rgba(255,255,255,0.25)',
                  color: 'rgba(255,255,255,0.6)',
                  fontFamily: '"Space Mono", monospace',
                }}
              >
                4K&nbsp;UHD
              </span>
            </motion.div>

            {/* Synopsis */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.55, ease: 'easeOut' }}
              className="text-sm md:text-base leading-relaxed mb-8 line-clamp-2 md:line-clamp-3"
              style={{
                color: 'var(--text-secondary)',
                maxWidth: '52ch',
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              {activeItem.overview}
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.51, duration: 0.55, ease: 'easeOut' }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-2"
            >
              {/* ▶ Watch Now */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onPlay?.(activeItem)}
                className="flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-[15px] md:text-base text-white shadow-xl transition-all"
                style={{
                  background: 'var(--accent)',
                  boxShadow: '0 0 30px var(--accent-glow), 0 4px 16px rgba(0,0,0,0.5)',
                  fontFamily: '"DM Sans", sans-serif',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hover)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)';
                }}
              >
                <Play size={18} fill="white" />
                Watch Now
              </motion.button>

              {/* ＋ Watchlist ghost */}
              <motion.button
                whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.10)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push(`/movie/${activeItem.id}`)}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-[15px] md:text-base text-white transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(12px)',
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                <Plus size={17} />
                Watchlist
              </motion.button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Arrow controls ───────────────────────────────────────────── */}
      {[
        { dir: -1 as const, icon: <ChevronLeft  size={26} />, side: 'left-4'  },
        { dir:  1 as const, icon: <ChevronRight size={26} />, side: 'right-4' },
      ].map(({ dir, icon, side }) => (
        <button
          key={side}
          onClick={() => go(dir)}
          className={`absolute ${side} top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 hidden md:flex`}
          style={{
            background: 'rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(8px)',
            color: 'rgba(255,255,255,0.80)',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,82,255,0.55)'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.45)'}
        >
          {icon}
        </button>
      ))}

      {/* ── Dot pagination ───────────────────────────────────────────── */}
      <div
        className="absolute bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"
      >
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > activeIndex ? 1 : -1); setActiveIndex(i); startTimer(); }}
            className="rounded-full transition-all duration-300"
            style={{
              width:  i === activeIndex ? '28px' : '6px',
              height: '6px',
              background: i === activeIndex
                ? 'var(--accent)'
                : 'rgba(255,255,255,0.25)',
              boxShadow: i === activeIndex ? '0 0 10px var(--accent-glow)' : 'none',
            }}
          />
        ))}
      </div>

      {/* ── Bottom bleed seamlessly into content rows ─────────────────── */}
      <div
        className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, var(--bg-primary))',
          zIndex: 5,
        }}
      />
    </section>
  );
};

export default HeroCarousel;
