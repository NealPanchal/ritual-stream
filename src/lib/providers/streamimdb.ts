/**
 * src/lib/providers/streamimdb.ts
 *
 * StreamIMDb — Secondary provider with broad library coverage.
 *
 * Movie: https://streamimdb.ru/embed/movie/{tmdbId}
 * TV:    https://streamimdb.ru/embed/tv/{tmdbId}/{season}/{episode}
 */

import type { StreamProvider } from './types';

export const streamimdbProvider: StreamProvider = {
  id: 'streamimdb',
  name: 'StreamIMDb',
  priority: 1,
  supportsMovie: true,
  supportsTV: true,
  healthCheckUrl: 'https://streamimdb.ru',

  generateMovieUrl(tmdbId: number, _audioLang = 'en'): string {
    return `https://streamimdb.ru/embed/movie/${tmdbId}?autoplay=1&autoPlay=true`;
  },

  generateTVUrl(tmdbId: number, season: number, episode: number, _audioLang = 'en'): string {
    return `https://streamimdb.ru/embed/tv/${tmdbId}/${season}/${episode}?autoplay=1&autoPlay=true`;
  },
};
