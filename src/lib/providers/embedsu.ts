/**
 * src/lib/providers/embedsu.ts
 *
 * Embed.su — Third-priority provider with fast loading times.
 *
 * Movie: https://embed.su/embed/movie/{tmdbId}
 * TV:    https://embed.su/embed/tv/{tmdbId}/{season}/{episode}
 */

import type { StreamProvider } from './types';

export const embedsuProvider: StreamProvider = {
  id: 'embedsu',
  name: 'Embed.su',
  priority: 3,
  supportsMovie: true,
  supportsTV: true,
  healthCheckUrl: 'https://embed.su',

  generateMovieUrl(tmdbId: number, _audioLang = 'en'): string {
    return `https://embed.su/embed/movie/${tmdbId}`;
  },

  generateTVUrl(tmdbId: number, season: number, episode: number, _audioLang = 'en'): string {
    return `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`;
  },
};
