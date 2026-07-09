'use client';

/**
 * /live — Live Sports Page
 *
 * Cineby-inspired live sports hub:
 *  - Centered hero heading + subtitle
 *  - Search bar
 *  - Category pill filter row
 *  - "Live Now" horizontal strip
 *  - Per-sport category strips below
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Radio } from 'lucide-react';
import LiveCard from '@/components/LiveCard';
import {
  LIVE_EVENTS,
  SPORT_CATEGORIES,
  SportCategory,
  getLiveNow,
} from '@/lib/live-data';

// ─── Horizontal live strip ────────────────────────────────────────────────────
function LiveStrip({ title, events }: { title: string; events: typeof LIVE_EVENTS }) {
  if (!events.length) return null;
  return (
    <section className="mb-10">
      {/* Row header — matches Cineby's red accent bar style */}
      <div className="flex items-center gap-2.5 mb-4">
        <span
          className="w-1 h-4 rounded-full flex-shrink-0"
          style={{ background: '#dc2626' }}
        />
        <h2
          className="text-xs font-bold tracking-[0.14em] uppercase text-white"
          style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
        >
          {title}
        </h2>
        {events.some(e => e.isLive) && (
          <span className="relative flex h-2 w-2 ml-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
        )}
      </div>

      {/* Scrollable card row */}
      <div
        className="flex gap-4 overflow-x-auto pb-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {events.map(event => (
          <LiveCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

// ─── Page component ───────────────────────────────────────────────────────────
export default function LivePage() {
  const [query,       setQuery]      = useState('');
  const [activeCategory, setCategory] = useState<SportCategory>('all');

  // Filter events by search query + active category
  const filtered = useMemo(() => {
    let events = LIVE_EVENTS;
    if (activeCategory !== 'all') {
      events = events.filter(e => e.sport === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      events = events.filter(
        e =>
          e.title.toLowerCase().includes(q) ||
          e.sport.toLowerCase().includes(q) ||
          (e.league ?? '').toLowerCase().includes(q)
      );
    }
    return events;
  }, [query, activeCategory]);

  const liveNow = useMemo(() => getLiveNow().slice(0, 8), []);

  // Per-sport sections when "All" is active and no search query
  const showSections = activeCategory === 'all' && !query.trim();
  const sportsWithEvents = useMemo(() => {
    if (!showSections) return [];
    return SPORT_CATEGORIES.filter(c => c.id !== 'all').map(c => ({
      ...c,
      events: LIVE_EVENTS.filter(e => e.sport === c.id),
    })).filter(s => s.events.length > 0);
  }, [showSections]);

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: 'var(--bg-primary, #0a0a0a)', fontFamily: '"DM Sans", system-ui, sans-serif' }}
    >
      {/* ── Hero header ──────────────────────────────────────────────────────── */}
      <div className="pt-28 pb-10 text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Radio size={18} color="#dc2626" />
            <span
              className="text-xs font-bold tracking-[0.2em] uppercase"
              style={{ color: '#dc2626', fontFamily: '"Space Mono", monospace' }}
            >
              Live Now
            </span>
          </div>
          <h1
            className="font-black text-white mb-3"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              letterSpacing: '-0.02em',
              lineHeight: 1.08,
            }}
          >
            Live Sports
          </h1>
          <p
            className="text-sm md:text-base mx-auto"
            style={{ color: 'rgba(255,255,255,0.45)', maxWidth: '44ch', lineHeight: 1.7 }}
          >
            Watch your favorite sports live in high quality.
            Never miss a game again.
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          className="relative mx-auto mt-6"
          style={{ maxWidth: '480px' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45, ease: 'easeOut' }}
        >
          <Search
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          />
          <input
            type="text"
            placeholder="Search sports events..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-sm text-white rounded-xl outline-none transition-all"
            style={{
              background:    'rgba(255,255,255,0.06)',
              border:        '1px solid rgba(255,255,255,0.10)',
              backdropFilter:'blur(8px)',
              fontFamily:    '"DM Sans", sans-serif',
            }}
            onFocus={e => {
              e.currentTarget.style.border = '1px solid rgba(220,38,38,0.55)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.10)';
            }}
            onBlur={e => {
              e.currentTarget.style.border = '1px solid rgba(255,255,255,0.10)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </motion.div>

        {/* Category pills */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mt-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.45, ease: 'easeOut' }}
        >
          {SPORT_CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background:  isActive ? 'rgba(220,38,38,0.90)' : 'rgba(255,255,255,0.06)',
                  border:      isActive ? '1px solid rgba(220,38,38,0.0)' : '1px solid rgba(255,255,255,0.12)',
                  color:       isActive ? '#fff' : 'rgba(255,255,255,0.60)',
                  fontFamily:  '"DM Sans", sans-serif',
                  boxShadow:   isActive ? '0 0 14px rgba(220,38,38,0.40)' : 'none',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </motion.div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────────── */}
      <div className="px-6 md:px-12 lg:px-16 pb-16" style={{ maxWidth: '1800px', margin: '0 auto' }}>
        <AnimatePresence mode="wait">
          {showSections ? (
            <motion.div
              key="sections"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* Live Now strip — top priority */}
              <LiveStrip title="Live Now" events={liveNow} />

              {/* Per-sport sections */}
              {sportsWithEvents.map(s => (
                <LiveStrip key={s.id} title={s.label} events={s.events} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="filtered"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {filtered.length > 0 ? (
                <>
                  <p
                    className="text-xs mb-5"
                    style={{ color: 'rgba(255,255,255,0.35)', fontFamily: '"Space Mono", monospace' }}
                  >
                    {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex flex-wrap gap-5">
                    {filtered.map(event => (
                      <LiveCard key={event.id} event={event} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-24">
                  <p style={{ color: 'rgba(255,255,255,0.30)', fontFamily: '"Space Mono", monospace' }}>
                    No events found for &ldquo;{query}&rdquo;
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
