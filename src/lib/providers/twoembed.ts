/**
 * src/lib/providers/twoembed.ts
 *
 * 2Embed — Fourth-priority provider with extensive older content library.
 *
 * Movie: https://www.2embed.cc/embed/{tmdbId}
 * TV:    https://www.2embed.cc/embedtv/{tmdbId}&s={season}&e={episode}
 */

import type { StreamProvider } from './types';

export const twoembedProvider: StreamProvider = {
  id: 'twoembed',
  name: '2Embed',
  priority: 4,
  supportsMovie: true,
  supportsTV: true,
  healthCheckUrl: 'https://www.2embed.cc',

  generateMovieUrl(tmdbId: number, _audioLang = 'en'): string {
    return `https://www.2embed.cc/embed/${tmdbId}`;
  },

  generateTVUrl(tmdbId: number, season: number, episode: number, _audioLang = 'en'): string {
    return `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`;
  },
};
