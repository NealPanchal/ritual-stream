/**
 * src/lib/providers/multiembed.ts
 *
 * MultiEmbed — Sixth-priority provider with multi-quality support.
 *
 * Movie: https://multiembed.mov/?video_id={tmdbId}&tmdb=1
 * TV:    https://multiembed.mov/?video_id={tmdbId}&tmdb=1&s={season}&e={episode}
 */

import type { StreamProvider } from './types';

export const multiembedProvider: StreamProvider = {
  id: 'multiembed',
  name: 'MultiEmbed',
  priority: 6,
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
