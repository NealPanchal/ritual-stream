'use client';

/**
 * ContentRow.tsx — Cinematic horizontal carousel section
 *
 * Features:
 * - Uppercase spaced category label + optional See All link
 * - Scroll-snap horizontal rail, no visible scrollbar
 * - Scroll-fade gradient edges (left / right)
 * - Staggered card entrance on first render
 * - Ghost arrow nav buttons (appear on hover)
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import MovieCard from './MovieCard';
import SkeletonLoader from './SkeletonLoader';
import { ContentRowProps } from '@/types';

const ContentRow = ({
  title,
  items,
  loading = false,
  type = 'all',
  hideHeader = false,
}: ContentRowProps & { hideHeader?: boolean }) => {
  const rowRef        = useRef<HTMLDivElement>(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  // ── Scroll-state tracker ────────────────────────────────────────────────────
  const checkScroll = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    // Initial check after items render
    const raf = requestAnimationFrame(checkScroll);
    return () => { el.removeEventListener('scroll', checkScroll); cancelAnimationFrame(raf); };
  }, [checkScroll, items]);

  const scroll = (dir: 'left' | 'right') => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? el.clientWidth * 0.8 : -(el.clientWidth * 0.8), behavior: 'smooth' });
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) return <div className="mb-2"><SkeletonLoader type="row" count={1} /></div>;
  if (!items?.length) return null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <motion.section
      className="relative"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* ── Row header ──────────────────────────────────────────────── */}
      {!hideHeader && (
        <div className="flex items-center justify-between mb-4 px-0.5">
          <h2
            className="text-xs font-bold tracking-[0.14em] uppercase"
            style={{
              color: 'var(--text-primary)',
              fontFamily: '"DM Sans", system-ui, sans-serif',
              letterSpacing: '0.14em',
            }}
          >
            {title}
          </h2>

          <AnimatePresence>
            {isHovering && (
              <motion.button
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-1 text-[11px] font-semibold transition-colors"
                style={{
                  color: 'var(--accent)',
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                See All <ArrowRight size={11} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Scroll container wrapper ─────────────────────────────────── */}
      <div className="relative">
        {/* Left fade-edge */}
        <AnimatePresence>
          {canLeft && (
            <motion.div
              key="fade-left"
              className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                background: 'linear-gradient(to right, var(--bg-primary) 30%, transparent)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Right fade-edge */}
        <AnimatePresence>
          {canRight && (
            <motion.div
              key="fade-right"
              className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                background: 'linear-gradient(to left, var(--bg-primary) 30%, transparent)',
              }}
            />
          )}
        </AnimatePresence>

        {/* ── Left arrow ────────────────────────────────────────────── */}
        <AnimatePresence>
          {canLeft && (
            <motion.button
              key="arrow-left"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full items-center justify-center hidden md:flex transition-all duration-200"
              style={{
                background: 'rgba(20,20,20,0.85)',
                border: '1px solid rgba(255,255,255,0.10)',
                backdropFilter: 'blur(6px)',
                color: '#ffffff',
                boxShadow: '0 2px 16px rgba(0,0,0,0.6)',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,82,255,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)')}
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── Right arrow ───────────────────────────────────────────── */}
        <AnimatePresence>
          {canRight && (
            <motion.button
              key="arrow-right"
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 4 }}
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full items-center justify-center hidden md:flex transition-all duration-200"
              style={{
                background: 'rgba(20,20,20,0.85)',
                border: '1px solid rgba(255,255,255,0.10)',
                backdropFilter: 'blur(6px)',
                color: '#ffffff',
                boxShadow: '0 2px 16px rgba(0,0,0,0.6)',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,82,255,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)')}
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── Scrollable card strip ──────────────────────────────────── */}
        <div
          ref={rowRef}
          className="flex gap-3 overflow-x-auto overflow-y-visible scrollbar-hide"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '72px',   /* room for hover-expanded card */
            paddingTop: '8px',
            scrollbarWidth: 'none',
          }}
        >
          {items.map((item, index) => {
            const mediaItem    = item as any;
            let mediaType: 'movie' | 'tv';
            let cardTitle: string;
            let releaseDate: string | undefined;
            let firstAirDate: string | undefined;

            if ('media_type' in mediaItem) {
              mediaType    = mediaItem.media_type === 'person' ? 'movie' : mediaItem.media_type;
              cardTitle    = mediaItem.title || mediaItem.name || '';
              releaseDate  = mediaItem.release_date;
              firstAirDate = mediaItem.first_air_date;
            } else if ('title' in mediaItem) {
              mediaType   = 'movie';
              cardTitle   = mediaItem.title;
              releaseDate = mediaItem.release_date;
            } else {
              mediaType    = 'tv';
              cardTitle    = mediaItem.name;
              firstAirDate = mediaItem.first_air_date;
            }

            return (
              <motion.div
                key={`${item.id}-${index}`}
                style={{
                  scrollSnapAlign: 'start',
                  flexShrink: 0,
                  /* staggered entrance */
                  animationDelay: `${index * 60}ms`,
                }}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4), ease: 'easeOut' }}
              >
                <MovieCard
                  id={item.id}
                  title={cardTitle}
                  poster_path={item.poster_path}
                  backdrop_path={item.backdrop_path}
                  vote_average={item.vote_average}
                  release_date={releaseDate}
                  first_air_date={firstAirDate}
                  media_type={mediaType}
                  season={mediaItem.season}
                  episode={mediaItem.episode}
                  progress={mediaItem.progress}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};

export default ContentRow;
