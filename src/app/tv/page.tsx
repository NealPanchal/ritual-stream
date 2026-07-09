'use client';

import { motion } from 'framer-motion';
import { usePopularTV, useTopRatedTV, useOnTheAirTV, useAiringTodayTV } from '@/lib/tmdb';
import dynamic from 'next/dynamic';

const ContentRow = dynamic(() => import('@/components/ContentRow'));
const SkeletonLoader = dynamic(() => import('@/components/SkeletonLoader'), { ssr: false });

export default function TVPage() {
  const { data: popular, isLoading: popularLoading } = usePopularTV();
  const { data: topRated, isLoading: topRatedLoading } = useTopRatedTV();
  const { data: onTheAir, isLoading: onTheAirLoading } = useOnTheAirTV();
  const { data: airingToday, isLoading: airingTodayLoading } = useAiringTodayTV();

  const isLoading = popularLoading || topRatedLoading || onTheAirLoading || airingTodayLoading;

  return (
    <div className="min-h-screen bg-base-black pt-24 pb-20 font-base">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-black text-white mb-2">TV Shows</h1>
          <p className="text-gray-400 text-lg">Binge-worthy series and trending TV shows.</p>
        </motion.div>

        {isLoading ? (
          <div className="space-y-12">
            <SkeletonLoader type="row" count={4} />
          </div>
        ) : (
          <div className="space-y-12">
            <ContentRow title="On The Air" items={onTheAir?.results || []} />
            <ContentRow title="Trending TV Shows" items={popular?.results || []} />
            <ContentRow title="Airing Today" items={airingToday?.results || []} />
            <ContentRow title="Top Rated Series" items={topRated?.results || []} />
          </div>
        )}
      </div>
    </div>
  );
}
