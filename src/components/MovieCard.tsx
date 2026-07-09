'use client';

/**
 * MovieCard.tsx — Cinematic media card
 *
 * Base card:
 * - Portrait 2:3 poster, 185px wide, rounded-[8px]
 * - Shimmer skeleton while loading
 * - Progress bar (blue) at the bottom for continue-watching
 *
 * On hover (desktop pointer devices only, 300ms delay):
 * - Expands into a 16:9 floating preview card (340px wide)
 * - YouTube trailer preview (muted, no controls)
 * - Slide-up overlay: title, year, rating badge, action buttons
 * - Glow ring: 0 0 0 2px accent, 0 8px 30px accent-glow
 * - Scale 1.06 on the base card (preview card handles its own scale)
 *
 * Touch devices: tap → navigate directly to detail page.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Play, Plus, Info, Check, Star } from 'lucide-react';
import { MovieCardProps } from '@/types';
import { isFavorite, toggleFavorite, getWatchProgress } from '@/utils/storage';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

// ─── Sub-component: rating badge ─────────────────────────────────────────────
function RatingBadge({ value }: { value: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold"
      style={{
        background: 'rgba(0, 82, 255, 0.15)',
        border: '1px solid rgba(0, 82, 255, 0.35)',
        color: '#6ba3ff',
        fontFamily: '"Space Mono", monospace',
      }}
    >
      <Star size={8} fill="currentColor" />
      {value.toFixed(1)}
    </span>
  );
}

// ─── Sub-component: genre / type pill ────────────────────────────────────────
function TypePill({ label }: { label: string }) {
  return (
    <span
      className="text-[10px] font-medium px-2.5 py-0.5 rounded-full capitalize"
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.10)',
        color: 'var(--text-secondary)',
        fontFamily: '"DM Sans", sans-serif',
      }}
    >
      {label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const MovieCard = ({
  id,
  title,
  poster_path,
  backdrop_path,
  vote_average,
  release_date,
  first_air_date,
  media_type,
  season,
  episode,
  progress: initialProgress,
  className = '',
}: MovieCardProps) => {
  const { address }  = useAccount();
  const router       = useRouter();

  const [imageLoaded,   setImageLoaded]   = useState(false);
  const [isHovered,     setIsHovered]     = useState(false);
  const [trailerKey,    setTrailerKey]    = useState<string | null>(null);
  const [trailerLoaded, setTrailerLoaded] = useState(false);
  const [inFavorites,   setInFavorites]   = useState(false);

  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef    = useRef<HTMLDivElement>(null);

  // ── Favorites + progress ────────────────────────────────────────────────────
  useEffect(() => {
    setInFavorites(isFavorite(id, media_type, address));
  }, [id, media_type, address]);

  const savedProgress     = getWatchProgress(id, media_type, season, episode, address);
  const progressPct       = Math.min(initialProgress || savedProgress?.percentage || 0, 99);

  // ── URLs ────────────────────────────────────────────────────────────────────
  const posterUrl  = poster_path   ? `https://image.tmdb.org/t/p/w500${poster_path}`   : '/placeholder-movie.jpg';
  const backdropUrl= backdrop_path ? `https://image.tmdb.org/t/p/w780${backdrop_path}` : null;
  const detailHref = media_type === 'movie' ? `/movie/${id}` : `/tv/${id}`;

  const year = release_date
    ? new Date(release_date).getFullYear()
    : first_air_date
    ? new Date(first_air_date).getFullYear()
    : null;

  // ── Trailer fetch (lazy, on hover) ──────────────────────────────────────────
  const fetchTrailer = useCallback(async () => {
    if (trailerKey !== null || !TMDB_API_KEY) return;
    try {
      const endpoint = media_type === 'movie'
        ? `https://api.themoviedb.org/3/movie/${id}/videos`
        : `https://api.themoviedb.org/3/tv/${id}/videos`;
      const res  = await fetch(`${endpoint}?api_key=${TMDB_API_KEY}&language=en-US`);
      const data = await res.json();
      const clip = data.results?.find(
        (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
      );
      setTrailerKey(clip?.key ?? '');
    } catch {
      setTrailerKey('');
    }
  }, [id, media_type, trailerKey]);

  const handleMouseEnter = useCallback(() => {
    hoverTimer.current = setTimeout(() => {
      setIsHovered(true);
      fetchTrailer();
    }, 300);
  }, [fetchTrailer]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setIsHovered(false);
    setTrailerLoaded(false);
  }, []);

  useEffect(() => () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); }, []);

  // ── Action handlers ─────────────────────────────────────────────────────────
  const stop = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); };

  const handlePlay = (e: React.MouseEvent) => { stop(e); router.push(detailHref); };
  const handleInfo = (e: React.MouseEvent) => { stop(e); router.push(detailHref); };
  const handleToggleFav = (e: React.MouseEvent) => {
    stop(e);
    toggleFavorite({ id, title, poster_path, backdrop_path, vote_average, release_date, first_air_date, media_type }, address);
    setInFavorites(f => !f);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      ref={cardRef}
      className={`relative flex-shrink-0 group/card ${className}`}
      onMouseEnter={() => {
        if (window.matchMedia('(pointer: fine)').matches) handleMouseEnter();
      }}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        if (!window.matchMedia('(pointer: fine)').matches) router.push(detailHref);
      }}
      style={{ zIndex: isHovered ? 50 : 'auto' }}
    >
      {/* ── Base poster card ────────────────────────────────────────── */}
      <motion.div
        className="relative cursor-pointer overflow-hidden"
        animate={{ scale: isHovered ? 1.06 : 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{
          width: '185px',
          aspectRatio: '2/3',
          borderRadius: 'var(--card-radius, 8px)',
          background: 'var(--bg-secondary)',
          boxShadow: isHovered
            ? '0 0 0 2px var(--accent), 0 8px 30px var(--accent-glow), 0 4px 20px rgba(0,0,0,0.5)'
            : '0 4px 20px rgba(0,0,0,0.5)',
          transition: 'box-shadow 0.2s ease',
        }}
        onClick={() => router.push(detailHref)}
      >
        {/* Shimmer skeleton */}
        {!imageLoaded && (
          <div
            className="absolute inset-0 skeleton-shimmer"
            style={{ borderRadius: 'inherit' }}
          />
        )}

        <Image
          src={posterUrl}
          alt={title}
          fill
          className={`object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          sizes="185px"
          onLoad={() => setImageLoaded(true)}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/wAAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwABmX/9k="
        />

        {/* Progress bar — continue watching */}
        {progressPct > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 h-[3px]"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <div
              className="h-full transition-all"
              style={{
                width: `${progressPct}%`,
                background: 'var(--accent)',
              }}
            />
          </div>
        )}

        {/* Hover: bottom title strip (visible on base card when NOT showing expanded) */}
        {isHovered && (
          <div
            className="absolute inset-x-0 bottom-0 px-2 py-1.5"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 60%, transparent)',
            }}
          />
        )}
      </motion.div>

      {/* ── Expanded hover preview card ──────────────────────────────── */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute left-1/2 top-0 -translate-x-1/2 cursor-pointer overflow-hidden"
            style={{
              width: '320px',
              zIndex: 100,
              borderRadius: '10px',
              background: 'var(--bg-secondary)',
              boxShadow: '0 0 0 1.5px rgba(255,255,255,0.08), 0 20px 60px rgba(0,0,0,0.75), 0 8px 30px var(--accent-glow)',
            }}
            initial={{ opacity: 0, scale: 0.88, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: -12 }}
            exit={{ opacity: 0, scale: 0.88, y: 10 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={() => router.push(detailHref)}
          >
            {/* 16:9 preview area */}
            <div
              className="relative w-full overflow-hidden bg-black"
              style={{ aspectRatio: '16/9' }}
            >
              {/* Backdrop fallback */}
              {backdropUrl && (
                <img
                  src={backdropUrl}
                  alt={title}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${trailerLoaded ? 'opacity-0' : 'opacity-100'}`}
                />
              )}

              {/* YouTube trailer */}
              {trailerKey && (
                <iframe
                  key={trailerKey}
                  src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&loop=1&playlist=${trailerKey}&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3`}
                  className={`absolute inset-0 w-full h-full border-0 transition-opacity duration-500 ${trailerLoaded ? 'opacity-100' : 'opacity-0'}`}
                  allow="autoplay; encrypted-media"
                  onLoad={() => setTrailerLoaded(true)}
                  title={`${title} preview`}
                />
              )}

              {/* Bottom gradient on preview */}
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, var(--bg-secondary) 0%, transparent 55%)' }}
              />

              {/* Rating badge — top left */}
              <div className="absolute top-2 left-2">
                {vote_average > 0 && <RatingBadge value={vote_average} />}
              </div>

              {/* HD badge — top right */}
              <div
                className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded"
                style={{
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: 'rgba(255,255,255,0.55)',
                  fontFamily: '"Space Mono", monospace',
                }}
              >
                HD
              </div>
            </div>

            {/* Card body */}
            <div className="px-3 pt-2.5 pb-3.5">
              {/* Action row */}
              <div
                className="flex items-center gap-2 mb-3"
                onClick={stop}
              >
                {/* ▶ Play */}
                <motion.button
                  onClick={handlePlay}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.94 }}
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: '#ffffff' }}
                  aria-label="Play"
                >
                  <Play size={15} fill="black" color="black" />
                </motion.button>

                {/* ＋ / ✓ Watchlist */}
                <motion.button
                  onClick={handleToggleFav}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.94 }}
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    border: inFavorites
                      ? '2px solid var(--accent)'
                      : '2px solid rgba(255,255,255,0.30)',
                    background: inFavorites ? 'rgba(0,82,255,0.15)' : 'transparent',
                    color: '#ffffff',
                  }}
                  aria-label={inFavorites ? 'Remove from watchlist' : 'Add to watchlist'}
                >
                  {inFavorites ? <Check size={15} /> : <Plus size={15} />}
                </motion.button>

                {/* ℹ Info — pushed right */}
                <motion.button
                  onClick={handleInfo}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.94 }}
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ml-auto"
                  style={{
                    border: '2px solid rgba(255,255,255,0.20)',
                    color: '#ffffff',
                  }}
                  aria-label="More info"
                >
                  <Info size={14} />
                </motion.button>
              </div>

              {/* Title */}
              <h3
                className="font-bold text-sm leading-snug mb-2 line-clamp-1"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                {title}
              </h3>

              {/* Metadata */}
              <div className="flex items-center gap-2 flex-wrap">
                {year && (
                  <span
                    className="text-[11px]"
                    style={{ color: 'var(--text-muted)', fontFamily: '"Space Mono", monospace' }}
                  >
                    {year}
                  </span>
                )}
                {media_type === 'tv' && season && episode && (
                  <span
                    className="text-[10px]"
                    style={{ color: 'var(--text-muted)', fontFamily: '"Space Mono", monospace' }}
                  >
                    S{String(season).padStart(2, '0')} E{String(episode).padStart(2, '0')}
                  </span>
                )}
                <TypePill label={media_type === 'tv' ? 'Series' : 'Film'} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MovieCard;
