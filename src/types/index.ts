// TMDB API Types
export interface Movie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path: string;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  original_title: string;
}

export interface TVShow {
  id: number;
  name: string;
  poster_path: string;
  backdrop_path: string;
  overview: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  original_language: string;
  original_name: string;
}

export interface MovieDetails extends Movie {
  budget: number;
  genres: Array<{ id: number; name: string }>;
  homepage: string;
  imdb_id: string;
  production_companies: Array<{ id: number; name: string; logo_path: string }>;
  production_countries: Array<{ iso_3166_1: string; name: string }>;
  revenue: number;
  runtime: number;
  spoken_languages: Array<{ iso_639_1: string; name: string }>;
  status: string;
  tagline: string;
  videos: { results: Array<{ id: string; key: string; name: string; site: string; type: string }> };
}

export interface TVShowDetails extends TVShow {
  created_by: Array<{ id: number; name: string; profile_path: string }>;
  episode_run_time: number[];
  genres: Array<{ id: number; name: string }>;
  homepage: string;
  in_production: boolean;
  languages: string[];
  last_air_date: string;
  networks: Array<{ id: number; name: string; logo_path: string }>;
  number_of_episodes: number;
  number_of_seasons: number;
  origin_country: string[];
  production_companies: Array<{ id: number; name: string; logo_path: string }>;
  seasons: Array<{
    air_date: string;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    poster_path: string;
    season_number: number;
  }>;
  status: string;
  tagline: string;
  type: string;
  videos: { results: Array<{ id: string; key: string; name: string; site: string; type: string }> };
}

export interface SearchResult {
  poster_path: string;
  adult: boolean;
  overview: string;
  release_date: string;
  first_air_date: string;
  genre_ids: number[];
  id: number;
  original_language: string;
  original_title: string;
  original_name: string;
  title: string;
  name: string;
  backdrop_path: string;
  popularity: number;
  vote_count: number;
  video: boolean;
  vote_average: number;
  media_type: 'movie' | 'tv' | 'person';
}

export interface APIResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// Database Types
export interface User {
  id: string;
  clerk_id: string;
  email: string;
  username: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface WatchHistory {
  id: string;
  user_id: string;
  content_id: number;
  content_type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  current_time: number;
  duration: number;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  content_id: number;
  content_type: 'movie' | 'tv';
  created_at: string;
}

// Player Types
export interface PlayerEvent {
  type: 'PLAYER_EVENT';
  event: 'ready' | 'timeupdate' | 'ended' | 'error' | 'play' | 'pause';
  data: {
    currentTime?: number;
    duration?: number;
    percentage?: number;
    message?: string;
  };
}

export interface PlayerProps {
  id: number;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  title?: string;
  onProgress?: (progress: number) => void;
  onEnded?: () => void;
}

// Component Props
export interface MovieCardProps {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path?: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  progress?: number;
  className?: string;
}

export interface ContentRowProps {
  title: string;
  items: (Movie | TVShow | SearchResult)[];
  loading?: boolean;
  type?: 'movie' | 'tv' | 'all';
}

// Search Types
export interface SearchHistory {
  id: string;
  query: string;
  timestamp: number;
}

// UI Types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface PaginationInfo {
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
