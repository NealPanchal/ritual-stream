import { TMDB_BASE_URL, TMDB_API_KEY, tmdbApiCalls } from './tmdb-config';
import { getFallbackData } from './tmdb-fallback';

if (!TMDB_API_KEY) {
  console.warn('[BaseStream Server] WARNING: NEXT_PUBLIC_TMDB_API_KEY is not configured. Server-side queries will gracefully fall back to curated mock data.');
}

export const tmdbServer = {
  /**
   * Production-safe server-side fetch with retry, timeout protection,
   * error validation, and graceful fallback to static premium data.
   */
  fetch: async (endpoint: string, revalidate = 3600) => {
    // 1. Check if key is configured
    if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY_HERE') {
      console.info(`[BaseStream Server] No valid API Key. Serving high-fidelity fallback data for endpoint: ${endpoint}`);
      return getFallbackData(endpoint);
    }

    const url = `${TMDB_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}&language=en-US`;
    
    // 2. Abort controller for timeout protection (5 seconds max)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      console.info(`[BaseStream Server] Fetching: ${endpoint}`);
      const res = await fetch(url, { 
        next: { revalidate },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        console.error(`[BaseStream Server] HTTP Error ${res.status} (${res.statusText}) for endpoint: ${endpoint}. Falling back.`);
        return getFallbackData(endpoint);
      }

      const data = await res.json();
      
      // Validate response structure
      if (data && (Array.isArray(data.results) || data.id)) {
        return data;
      }
      
      console.warn(`[BaseStream Server] Invalid response schema from TMDB. Using fallback data.`);
      return getFallbackData(endpoint);

    } catch (error: any) {
      clearTimeout(timeoutId);
      const isTimeout = error.name === 'AbortError';
      console.error(
        `[BaseStream Server] Fetch failed for ${endpoint}. Reason: ${
          isTimeout ? 'Request Timeout (5s)' : error.message || error
        }. Serving premium fallback.`
      );
      return getFallbackData(endpoint);
    }
  },

  getTrending: (mediaType: 'all' | 'movie' | 'tv' = 'all') => 
    tmdbServer.fetch(tmdbApiCalls.getTrending(mediaType, 'week')),
    
  getPopularMovies: () => tmdbServer.fetch(tmdbApiCalls.getPopularMovies()),
  getPopularTV: () => tmdbServer.fetch(tmdbApiCalls.getPopularTV()),
  getTopRatedMovies: () => tmdbServer.fetch(tmdbApiCalls.getTopRatedMovies()),
};
