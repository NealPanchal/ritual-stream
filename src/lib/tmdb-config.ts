export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

// ─── OTT Provider IDs (TMDB watch_providers) ─────────────────────────────────
export const OTT_PROVIDERS = {
  Netflix:     { id: 8,    label: 'Netflix',    color: '#E50914', letter: 'N' },
  Prime:       { id: 9,    label: 'Prime Video', color: '#00A8E0', letter: 'P' },
  Disney:      { id: 337,  label: 'Disney+',    color: '#113CCF', letter: 'D' },
  Max:         { id: 1899, label: 'Max',         color: '#0033CC', letter: 'M' },
  AppleTV:     { id: 2,    label: 'Apple TV+',  color: '#555555', letter: 'A' },
  Paramount:   { id: 531,  label: 'Paramount+', color: '#0064FF', letter: 'P+' },
  Hulu:        { id: 15,   label: 'Hulu',       color: '#1CE783', letter: 'H' },
} as const;

export type OTTProviderKey = keyof typeof OTT_PROVIDERS;

export const tmdbApiCalls = {
  // Trending
  getTrending: (mediaType: 'all' | 'movie' | 'tv' | 'person' = 'all', timeWindow: 'day' | 'week' = 'week') =>
    `/trending/${mediaType}/${timeWindow}`,

  // Movies
  getMovieDetails: (id: string | number, appendToResponse = 'videos,credits,similar') =>
    `/movie/${id}?append_to_response=${appendToResponse}`,

  getPopularMovies:   (page = 1) => `/movie/popular?page=${page}`,
  getTopRatedMovies:  (page = 1) => `/movie/top_rated?page=${page}`,
  getUpcomingMovies:  (page = 1) => `/movie/upcoming?page=${page}`,
  getNowPlayingMovies:(page = 1) => `/movie/now_playing?page=${page}`,

  // TV Shows
  getTVDetails: (id: string | number, appendToResponse = 'videos,credits,similar') =>
    `/tv/${id}?append_to_response=${appendToResponse}`,

  getPopularTV:    (page = 1) => `/tv/popular?page=${page}`,
  getTopRatedTV:   (page = 1) => `/tv/top_rated?page=${page}`,
  getOnTheAirTV:   (page = 1) => `/tv/on_the_air?page=${page}`,
  getAiringTodayTV:(page = 1) => `/tv/airing_today?page=${page}`,

  // OTT Provider content via TMDB Discover
  // watch_region=US ensures providers are matched correctly
  getProviderMovies: (providerId: number, page = 1) =>
    `/discover/movie?with_watch_providers=${providerId}&watch_region=US&sort_by=popularity.desc&page=${page}`,
  getProviderTV: (providerId: number, page = 1) =>
    `/discover/tv?with_watch_providers=${providerId}&watch_region=US&sort_by=popularity.desc&page=${page}`,

  // Anime — genre 16 (Animation) on TV
  getAnime: (page = 1) =>
    `/discover/tv?with_genres=16&sort_by=popularity.desc&page=${page}`,

  // Action movies
  getActionMovies: (page = 1) =>
    `/discover/movie?with_genres=28&sort_by=popularity.desc&page=${page}`,

  // Search
  searchMulti: (query: string, page = 1) =>
    `/search/multi?query=${encodeURIComponent(query)}&page=${page}`,
};
