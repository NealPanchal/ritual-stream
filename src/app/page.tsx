import { Metadata } from 'next';
import { tmdbServer } from '@/lib/tmdb-server';
import { tmdbApiCalls } from '@/lib/tmdb-config';
import AccessGate from '@/components/AccessGate';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  other: {
    'base:app_id': '69c65070638fc70642e549dc',
  },
};


/**
 * Server-side entry point for the homepage.
 * Fetches initial data on the server for instant rendering on Vercel.
 */
export default async function HomePage() {
  // Parallel fetch all initial content categories
  const [
    trendingDay,
    trendingWeek,
    popularMovies,
    popularTV,
    topRatedMovies
  ] = await Promise.all([
    tmdbServer.fetch(tmdbApiCalls.getTrending('movie', 'day')),
    tmdbServer.fetch(tmdbApiCalls.getTrending('all', 'week')),
    tmdbServer.fetch(tmdbApiCalls.getPopularMovies()),
    tmdbServer.fetch(tmdbApiCalls.getPopularTV()),
    tmdbServer.fetch(tmdbApiCalls.getTopRatedMovies()),
  ]);

  // Construct SWR fallback object for client-side hydration
  const fallback = {
    [tmdbApiCalls.getTrending('movie', 'day')]: trendingDay,
    [tmdbApiCalls.getTrending('all', 'week')]: trendingWeek,
    [tmdbApiCalls.getPopularMovies()]: popularMovies,
    [tmdbApiCalls.getPopularTV()]: popularTV,
    [tmdbApiCalls.getTopRatedMovies()]: topRatedMovies,
  };

  return (
    <AccessGate>
      <HomeClient fallback={fallback} />
    </AccessGate>
  );
}
