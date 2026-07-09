'use client';

/**
 * SkeletonLoader.tsx — Cinematic shimmer skeletons
 *
 * Uses the .skeleton-shimmer CSS class (defined in globals.css) for the
 * moving gradient effect. Matches the card/row dimensions in the live UI.
 */

import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  type?: 'card' | 'hero' | 'text' | 'row';
  count?: number;
}

// ── Individual skeleton shapes ────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="flex-shrink-0" style={{ width: '185px' }}>
    <div
      className="skeleton-shimmer rounded-lg mb-2"
      style={{ width: '185px', aspectRatio: '2/3' }}
    />
    <div className="skeleton-shimmer h-3 rounded mb-1.5 w-4/5" />
    <div className="skeleton-shimmer h-2.5 rounded w-1/2" />
  </div>
);

const SkeletonHero = () => (
  <div
    className="skeleton-shimmer w-full"
    style={{ height: 'clamp(480px, 88vh, 860px)' }}
  />
);

const SkeletonRow = () => (
  <div>
    {/* Row label */}
    <div className="skeleton-shimmer h-3 rounded mb-4" style={{ width: '120px' }} />
    {/* Card strip */}
    <div className="flex gap-3 overflow-hidden" style={{ paddingBottom: '72px' }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

const SkeletonText = () => (
  <div>
    <div className="skeleton-shimmer h-4 rounded mb-2" />
    <div className="skeleton-shimmer h-4 rounded mb-2 w-5/6" />
    <div className="skeleton-shimmer h-4 rounded w-4/6" />
  </div>
);

// ── Exported component ────────────────────────────────────────────────────────

const SkeletonLoader = ({ type = 'card', count = 1 }: SkeletonLoaderProps) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'hero': return <SkeletonHero />;
      case 'row':  return <SkeletonRow />;
      case 'text': return <SkeletonText />;
      default:     return <SkeletonCard />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={type === 'row' ? 'mb-14' : ''}>
          {renderSkeleton()}
        </div>
      ))}
    </motion.div>
  );
};

export default SkeletonLoader;
