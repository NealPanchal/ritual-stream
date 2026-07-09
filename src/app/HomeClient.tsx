'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SWRConfig } from 'swr';
import dynamic from 'next/dynamic';
import { useTrending, usePopularMovies, usePopularTV, useTopRatedMovies } from '@/lib/tmdb';
import { tmdbApiCalls } from '@/lib/tmdb-config';
import { getContinueWatching } from '@/utils/storage';
import { Movie, TVShow } from '@/types';
import AccessBadge from '@/components/AccessBadge';
import { useAccess } from '@/hooks/useAccess';
import { usePlayerStore } from '@/store/playerStore';
import { buildMovieEmbedUrl } from '@/lib/player-prefs';

// Dynamic imports for performance
const ContentRow = dynamic(() => import('@/components/ContentRow'), { 
  loading: () => <div className="skeleton-shimmer h-48 w-full rounded-lg" />
});
const HeroCarousel = dynamic(() => import('@/components/HeroCarousel'), {
  loading: () => <div className="skeleton-shimmer w-full" style={{ height: 'clamp(480px,88vh,860px)' }} />
});
const SkeletonLoader = dynamic(() => import('@/components/SkeletonLoader'), { 
  ssr: false 
});

interface HomeClientProps {
  fallback: Record<string, any>;
}

export default function HomeClient({ fallback }: HomeClientProps) {
  return (
    <SWRConfig value={{ fallback }}>
      <HomeContent />
    </SWRConfig>
  );
}

function HomeContent() {
  const [continueWatching, setContinueWatching] = useState<(Movie | TVShow)[]>([]);
  const { address } = useAccount();
  const router = useRouter();
  
  const { audioLang, server } = usePlayerStore();
  
  // No redirect here, AccessGate handles it. We just need the badge.
  const { hasAccess, timeRemaining, timeFormatted } = useAccess(false, address);
  
  // Fetch data using SWR hooks (will use fallback data instantly)
  const { data: trendingDayData, isLoading: trendingDayLoading } = useTrending('movie', 'day');
  const { data: trendingData, isLoading: trendingLoading } = useTrending('all', 'week');
  const { data: popularMoviesData, isLoading: popularMoviesLoading } = usePopularMovies();
  const { data: popularTVData, isLoading: popularTVLoading } = usePopularTV();
  const { data: topRatedMoviesData, isLoading: topRatedLoading } = useTopRatedMovies();

  useEffect(() => {
    if (address) {
      const watchedItems = getContinueWatching(address, 10);
      setContinueWatching(watchedItems);
    }
  }, [address]);

  const handlePlayContent = (movie: Movie) => {
    router.push(`/movie/${movie.id}`);
  };

  const carouselItems = trendingDayData?.results?.slice(0, 7) || [];
  const trendingMovies = trendingData?.results?.filter((item: any) => item.media_type === 'movie') || [];
  const trendingTV = trendingData?.results?.filter((item: any) => item.media_type === 'tv') || [];

  return (
    <div className="min-h-screen text-white font-base">
      {/* Active access indicator */}
      {hasAccess && (
        <motion.div
          className="hidden sm:flex fixed top-24 right-6 lg:right-10 z-50 flex-col items-end gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 }}
        >
          <AccessBadge
            timeRemaining={timeRemaining}
            timeFormatted={timeFormatted}
            variant="default"
          />
        </motion.div>
      )}



      {/* Hero Carousel */}
      {carouselItems.length > 0 ? (
        <HeroCarousel items={carouselItems} onPlay={handlePlayContent} />
      ) : (
        <div className="skeleton-shimmer w-full" style={{ height: 'clamp(480px,88vh,860px)' }} />
      )}

      {/* ── Content Rows ─────────────────────────────────── */}
      <div
        className="mx-auto px-4 sm:px-6 md:px-10 xl:px-14 pb-24 space-y-14"
        style={{ maxWidth: '1800px' }}
      >
        <AnimatePresence mode="popLayout">
          {continueWatching.length > 0 && (
            <ContentRow key="continue" title="Continue Watching" items={continueWatching} />
          )}
          <ContentRow key="trending-movies" title="Trending Today"         items={trendingMovies}                    loading={trendingLoading} />
          <ContentRow key="trending-tv"     title="New on RitualStream"       items={trendingTV}                        loading={trendingLoading} />
          <ContentRow key="popular-movies"  title="Popular Hits"            items={popularMoviesData?.results || []}   loading={popularMoviesLoading} />
          <ContentRow key="popular-tv"      title="Binge-Worthy TV"         items={popularTVData?.results || []}      loading={popularTVLoading} />
          <ContentRow key="top-rated"       title="Critically Acclaimed"    items={topRatedMoviesData?.results || []} loading={topRatedLoading} />
        </AnimatePresence>
      </div>
    </div>
  );
}
