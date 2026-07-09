'use client';

import { motion } from 'framer-motion';
import { usePopularMovies, useTopRatedMovies, useUpcomingMovies, useNowPlayingMovies } from '@/lib/tmdb';
import dynamic from 'next/dynamic';

const ContentRow = dynamic(() => import('@/components/ContentRow'));
const SkeletonLoader = dynamic(() => import('@/components/SkeletonLoader'), { ssr: false });

export default function MoviesPage() {
  const { data: popular, isLoading: popularLoading } = usePopularMovies();
  const { data: topRated, isLoading: topRatedLoading } = useTopRatedMovies();
  const { data: upcoming, isLoading: upcomingLoading } = useUpcomingMovies();
  const { data: nowPlaying, isLoading: nowPlayingLoading } = useNowPlayingMovies();

  const isLoading = popularLoading || topRatedLoading || upcomingLoading || nowPlayingLoading;

  return (
    <div className="min-h-screen bg-base-black pt-24 pb-20 font-base">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-black text-white mb-2">Movies</h1>
          <p className="text-gray-400 text-lg">Browse through our collection of premium movies.</p>
        </motion.div>

        {isLoading ? (
          <div className="space-y-12">
            <SkeletonLoader type="row" count={4} />
          </div>
        ) : (
          <div className="space-y-12">
            <ContentRow title="Now Playing" items={nowPlaying?.results || []} />
            <ContentRow title="Popular on RitualStream" items={popular?.results || []} />
            <ContentRow title="Upcoming Releases" items={upcoming?.results || []} />
            <ContentRow title="Top Rated Classics" items={topRated?.results || []} />
          </div>
        )}
      </div>
    </div>
  );
}
