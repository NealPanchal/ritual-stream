'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';

interface CinematicLoadingProps {
  backdropUrl: string | null;
  posterUrl: string | null;
  title: string;
}

export const CinematicLoading = memo(function CinematicLoading({ backdropUrl, posterUrl, title }: CinematicLoadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-10 flex items-center justify-center bg-black overflow-hidden"
    >
      {/* Blurred Backdrop — Multi-layer */}
      {backdropUrl && (
        <div className="absolute inset-0 z-0">
          <img
            src={backdropUrl}
            alt=""
            className="w-full h-full object-cover opacity-25 scale-110"
            style={{ filter: 'blur(20px) saturate(1.2)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        </div>
      )}

      {/* Vignette effect */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* Shimmer overlay */}
      <div className="absolute inset-0 z-[2] cinematic-shimmer" />

      {/* Content */}
      <div className="relative z-[3] flex flex-col items-center gap-6 p-6 max-w-lg w-full">
        {/* Poster thumbnail with scale-in animation */}
        {posterUrl ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            className="w-24 md:w-32 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative"
          >
            <img
              src={posterUrl}
              alt={title}
              className="w-full h-auto object-cover"
            />
            {/* Subtle shimmer on poster */}
            <div className="absolute inset-0 cinematic-shimmer opacity-40" />
          </motion.div>
        ) : (
          <div className="w-24 md:w-32 aspect-[2/3] rounded-xl bg-white/[0.06] animate-pulse" />
        )}

        {/* Title area */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <h3 className="text-white/90 text-lg font-semibold tracking-tight max-w-[280px] truncate">
            {title}
          </h3>
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-2 flex items-center gap-3"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5 border-2 border-[#0052ff] border-t-transparent rounded-full"
          />
          <span className="text-gray-400/80 text-sm font-medium tracking-wide">
            Preparing your experience…
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
});
