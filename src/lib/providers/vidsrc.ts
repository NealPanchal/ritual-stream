/**
 * src/lib/providers/vidsrc.ts
 *
 * VidSrc — Primary default provider with highest reliability.
 *
 * Movie: https://vidsrc.to/embed/movie/{tmdbId}
 * TV:    https://vidsrc.to/embed/tv/{tmdbId}/{season}/{episode}
 */

import type { StreamProvider } from './types';

export const vidsrcProvider: StreamProvider = {
  id: 'vidsrc',
  name: 'VidSrc',
  priority: 2,
  supportsMovie: true,
  supportsTV: true,
  healthCheckUrl: 'https://vidsrc.to',

  generateMovieUrl(tmdbId: number, _audioLang = 'en'): string {
    return `https://vidsrc.to/embed/movie/${tmdbId}?autoplay=1&autoPlay=true`;
  },

  generateTVUrl(tmdbId: number, season: number, episode: number, _audioLang = 'en'): string {
    return `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}?autoplay=1&autoPlay=true`;
  },
};
