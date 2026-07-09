/**
 * src/lib/providers/backup.ts
 *
 * Backup Stream — Lowest-priority emergency fallback provider.
 * Previously known as VidKing. Supports audio language params and autoplay.
 *
 * Movie: https://www.vidking.net/embed/movie/{tmdbId}?autoPlay=true&color=0052FF&lang={lang}
 * TV:    https://www.vidking.net/embed/tv/{tmdbId}/{season}/{episode}?autoPlay=true&color=0052FF&lang={lang}
 */

import type { StreamProvider } from './types';

export const backupProvider: StreamProvider = {
  id: 'backup',
  name: 'Backup Stream',
  priority: 7,
  supportsMovie: true,
  supportsTV: true,
  healthCheckUrl: 'https://www.vidking.net',

  generateMovieUrl(tmdbId: number, audioLang = 'en'): string {
    const params = new URLSearchParams({
      autoPlay: 'true',
      color: '0052FF',
      lang: audioLang,
    });
    return `https://www.vidking.net/embed/movie/${tmdbId}?${params}`;
  },

  generateTVUrl(tmdbId: number, season: number, episode: number, audioLang = 'en'): string {
    const params = new URLSearchParams({
      autoPlay: 'true',
      color: '0052FF',
      lang: audioLang,
    });
    return `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}?${params}`;
  },
};
