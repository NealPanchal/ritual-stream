import axios from 'axios';
import useSWR from 'swr';
import { TMDB_BASE_URL, TMDB_API_KEY, tmdbApiCalls } from './tmdb-config';
import { getFallbackData, MOCK_MOVIES, MOCK_TV } from './tmdb-fallback';

// ─── Axios instance ───────────────────────────────────────────────────────────

const tmdbAxios = axios.create({
  baseURL: TMDB_BASE_URL,
  timeout: 6000, // 6 seconds timeout when API key IS present
  headers: { 'Content-Type': 'application/json' },
});

tmdbAxios.interceptors.request.use(
  (config: any) => {
    if (TMDB_API_KEY && TMDB_API_KEY !== 'YOUR_TMDB_API_KEY_HERE') {
      config.params = { ...config.params, api_key: TMDB_API_KEY, language: 'en-US' };
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

/**
 * Production-safe fetcher utility with timeout protection,
 * environment validation, and robust fallback fallback data.
 */
const fetcher = async (url: string) => {
  // 1. Fail early if key is missing or placeholder — return fallback IMMEDIATELY
  if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY_HERE') {
    return getFallbackData(url);
  }

  try {
    const response = await tmdbAxios.get(url);
    
    // Validate response schema
    if (response.data && (Array.isArray(response.data.results) || response.data.id)) {
      return response.data;
    }
    
    console.warn(`[BaseStream Client] Invalid data format returned from TMDB. Using fallback database.`);
    return getFallbackData(url);
  } catch (error: any) {
    console.error(`[BaseStream Client] API Query failed for: ${url}. Reason: ${error.message}. Resolving with local database.`);
    return getFallbackData(url);
  }
};

// ─── Core hooks ───────────────────────────────────────────────────────────────

export const useTrending = (
  mediaType: 'all' | 'movie' | 'tv' | 'person' = 'all',
  timeWindow: 'day' | 'week' = 'week'
) => {
  const { data, error, isLoading, mutate } = useSWR(
    tmdbApiCalls.getTrending(mediaType, timeWindow), fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: true, dedupingInterval: 60000 }
  );
  return { data, error, isLoading, mutate };
};

export const usePopularMovies = (page = 1) => {
  const { data, error, isLoading, mutate } = useSWR(
    tmdbApiCalls.getPopularMovies(page), fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: true, dedupingInterval: 300000 }
  );
  return { data, error, isLoading, mutate };
};

export const useTopRatedMovies = (page = 1) => {
  const { data, error, isLoading, mutate } = useSWR(
    tmdbApiCalls.getTopRatedMovies(page), fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: true, dedupingInterval: 600000 }
  );
  return { data, error, isLoading, mutate };
};

export const useUpcomingMovies = (page = 1) => {
  const { data, error, isLoading, mutate } = useSWR(
    tmdbApiCalls.getUpcomingMovies(page), fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: true, dedupingInterval: 300000 }
  );
  return { data, error, isLoading, mutate };
};

export const useNowPlayingMovies = (page = 1) => {
  const { data, error, isLoading, mutate } = useSWR(
    tmdbApiCalls.getNowPlayingMovies(page), fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: true, dedupingInterval: 300000 }
  );
  return { data, error, isLoading, mutate };
};

export const usePopularTV = (page = 1) => {
  const { data, error, isLoading, mutate } = useSWR(
    tmdbApiCalls.getPopularTV(page), fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: true, dedupingInterval: 300000 }
  );
  return { data, error, isLoading, mutate };
};

export const useTopRatedTV = (page = 1) => {
  const { data, error, isLoading, mutate } = useSWR(
    tmdbApiCalls.getTopRatedTV(page), fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: true, dedupingInterval: 600000 }
  );
  return { data, error, isLoading, mutate };
};

export const useAiringTodayTV = (page = 1) => {
  const { data, error, isLoading, mutate } = useSWR(
    tmdbApiCalls.getAiringTodayTV(page), fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: true, dedupingInterval: 300000 }
  );
  return { data, error, isLoading, mutate };
};

export const useOnTheAirTV = (page = 1) => {
  const { data, error, isLoading, mutate } = useSWR(
    tmdbApiCalls.getOnTheAirTV(page), fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: true, dedupingInterval: 300000 }
  );
  return { data, error, isLoading, mutate };
};

export const useSearch = (query: string, page = 1) => {
  const { data, error, isLoading, mutate } = useSWR(
    query ? tmdbApiCalls.searchMulti(query, page) : null, fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );
  return { data, error, isLoading, mutate };
};

export const useMovieDetails = (id: string | number) => {
  const { data, error, isLoading, mutate } = useSWR(
    id ? tmdbApiCalls.getMovieDetails(id) : null, fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: true, dedupingInterval: 300000 }
  );
  return { data, error, isLoading, mutate };
};

export const useTVDetails = (id: string | number) => {
  const { data, error, isLoading, mutate } = useSWR(
    id ? tmdbApiCalls.getTVDetails(id) : null, fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: true, dedupingInterval: 300000 }
  );
  return { data, error, isLoading, mutate };
};

// ─── OTT Provider hooks ───────────────────────────────────────────────────────

export const useProviderMovies = (providerId: number, enabled = true) => {
  const { data, error, isLoading } = useSWR(
    enabled && providerId ? tmdbApiCalls.getProviderMovies(providerId) : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 600000 }
  );
  return { data, error, isLoading };
};

export const useProviderTV = (providerId: number, enabled = true) => {
  const { data, error, isLoading } = useSWR(
    enabled && providerId ? tmdbApiCalls.getProviderTV(providerId) : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 600000 }
  );
  return { data, error, isLoading };
};

// ─── Genre / category hooks ───────────────────────────────────────────────────

export const useAnime = (page = 1) => {
  const { data, error, isLoading } = useSWR(
    tmdbApiCalls.getAnime(page), fetcher,
    { revalidateOnFocus: false, dedupingInterval: 600000 }
  );
  return { data, error, isLoading };
};

export const useActionMovies = (page = 1) => {
  const { data, error, isLoading } = useSWR(
    tmdbApiCalls.getActionMovies(page), fetcher,
    { revalidateOnFocus: false, dedupingInterval: 600000 }
  );
  return { data, error, isLoading };
};

export const useNewReleases = () => useNowPlayingMovies();

// ─── Raw API access ───────────────────────────────────────────────────────────

export const tmdbApi = {
  get: async (url: string): Promise<any> => {
    // If TMDB key is missing, return fallback directly
    if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY_HERE') {
      return getFallbackData(url);
    }
    try {
      const response = await tmdbAxios.get(url);
      return response.data;
    } catch {
      return getFallbackData(url);
    }
  },
};

export default tmdbApi;
