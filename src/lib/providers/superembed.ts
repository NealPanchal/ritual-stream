/**
 * src/lib/providers/superembed.ts
 *
 * SuperEmbed — Fifth-priority multi-host aggregator with automatic fallbacks.
 *
 * Movie: https://multiembed.mov/?video_id={tmdbId}&tmdb=1
 * TV:    https://multiembed.mov/?video_id={tmdbId}&tmdb=1&s={season}&e={episode}
 */

import type { StreamProvider } from './types';

export const superembedProvider: StreamProvider = {
  id: 'superembed',
  name: 'SuperEmbed',
  priority: 5,
  supportsMovie: true,
  supportsTV: true,
  healthCheckUrl: 'https://multiembed.mov',

  generateMovieUrl(tmdbId: number, _audioLang = 'en'): string {
    return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;
  },

  generateTVUrl(tmdbId: number, season: number, episode: number, _audioLang = 'en'): string {
    return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
  },
};
