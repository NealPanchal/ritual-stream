/**
 * src/lib/player-prefs.ts — Language constants + localStorage preference helpers
 *
 * Audio language switching works by rebuilding the iframe embed URL with
 * the selected language code as a URL param (e.g. ?lang=hi).
 *
 * Subtitles are fetched from OpenSubtitles and rendered as a custom HTML
 * overlay on top of the cross-origin iframe.
 *
 * URL builders delegate to the provider registry (src/lib/providers/)
 * and return `null` when required fields are missing.
 */

import {
  logEmbedUrl,
  logValidationFailure,
} from './stream-logger';

import { getProvider, STREAM_SERVERS as REGISTRY_SERVERS } from './providers';

// ─── Language definitions ─────────────────────────────────────────────────────

export interface Language {
  code: string;       // ISO 639-1
  label: string;      // English name
  native: string;     // Name in the native language
  flag: string;       // Flag emoji
  osCode: string;     // OpenSubtitles language code
}

export const AUDIO_LANGUAGES: Language[] = [
  { code: 'en', label: 'English',    native: 'English',    flag: '🇺🇸', osCode: 'en' },
  { code: 'hi', label: 'Hindi',      native: 'हिंदी',       flag: '🇮🇳', osCode: 'hi' },
  { code: 'ja', label: 'Japanese',   native: '日本語',       flag: '🇯🇵', osCode: 'ja' },
  { code: 'ko', label: 'Korean',     native: '한국어',       flag: '🇰🇷', osCode: 'ko' },
  { code: 'es', label: 'Spanish',    native: 'Español',    flag: '🇪🇸', osCode: 'es' },
  { code: 'fr', label: 'French',     native: 'Français',   flag: '🇫🇷', osCode: 'fr' },
  { code: 'de', label: 'German',     native: 'Deutsch',    flag: '🇩🇪', osCode: 'de' },
  { code: 'ta', label: 'Tamil',      native: 'தமிழ்',       flag: '🇮🇳', osCode: 'ta' },
  { code: 'te', label: 'Telugu',     native: 'తెలుగు',     flag: '🇮🇳', osCode: 'te' },
  { code: 'ar', label: 'Arabic',     native: 'العربية',    flag: '🇸🇦', osCode: 'ar' },
  { code: 'pt', label: 'Portuguese', native: 'Português',  flag: '🇧🇷', osCode: 'pt' },
];

export const SUBTITLE_LANGUAGES: Language[] = [
  { code: 'en',    label: 'English',    native: 'English',    flag: '🇺🇸', osCode: 'en' },
  { code: 'en-cc', label: 'English CC', native: 'English CC', flag: '🇺🇸', osCode: 'en' },
  { code: 'hi',    label: 'Hindi',      native: 'हिंदी',       flag: '🇮🇳', osCode: 'hi' },
  { code: 'ja',    label: 'Japanese',   native: '日本語',       flag: '🇯🇵', osCode: 'ja' },
  { code: 'es',    label: 'Spanish',    native: 'Español',    flag: '🇪🇸', osCode: 'es' },
  { code: 'fr',    label: 'French',     native: 'Français',   flag: '🇫🇷', osCode: 'fr' },
  { code: 'ar',    label: 'Arabic',     native: 'العربية',    flag: '🇸🇦', osCode: 'ar' },
  { code: 'ko',    label: 'Korean',     native: '한국어',       flag: '🇰🇷', osCode: 'ko' },
  { code: 'de',    label: 'German',     native: 'Deutsch',    flag: '🇩🇪', osCode: 'de' },
  { code: 'pt',    label: 'Portuguese', native: 'Português',  flag: '🇧🇷', osCode: 'pt' },
];

// ─── Subtitle style ───────────────────────────────────────────────────────────

export interface SubtitleStyle {
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  bgOpacity: 'none' | 'low' | 'medium' | 'high';
  color: 'white' | 'yellow';
  position: 'bottom' | 'top';
}

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  fontSize:  'medium',
  bgOpacity: 'medium',
  color:     'white',
  position:  'bottom',
};

export const FONT_SIZE_MAP: Record<SubtitleStyle['fontSize'], string> = {
  small:  '14px',
  medium: '18px',
  large:  '22px',
  xl:     '28px',
};

export const BG_OPACITY_MAP: Record<SubtitleStyle['bgOpacity'], string> = {
  none:   'rgba(0,0,0,0)',
  low:    'rgba(0,0,0,0.45)',
  medium: 'rgba(0,0,0,0.72)',
  high:   'rgba(0,0,0,0.92)',
};

// ─── localStorage helpers ─────────────────────────────────────────────────────

const LS_KEY = 'bs_player_prefs';

export interface StreamServer {
  id: string;
  name: string;
  description: string;
}

/** Derived from the provider registry — no manual sync needed. */
export const STREAM_SERVERS: StreamServer[] = REGISTRY_SERVERS;

export interface PlayerPrefs {
  audioLang:       string;
  subtitleLang:    string;
  subtitleEnabled: boolean;
  subtitleStyle:   SubtitleStyle;
  server:          string;
}

export const DEFAULT_PREFS: PlayerPrefs = {
  audioLang:       'en',
  subtitleLang:    'en',
  subtitleEnabled: false,
  subtitleStyle:   DEFAULT_SUBTITLE_STYLE,
  server:          'vidsrc',
};

export function loadPrefs(): PlayerPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return detectBrowserLanguage();
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: Partial<PlayerPrefs>): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadPrefs();
    localStorage.setItem(LS_KEY, JSON.stringify({ ...existing, ...prefs }));
  } catch {
    // quota exceeded — ignore
  }
}

/** Detect browser language and map to a supported audio language code */
function detectBrowserLanguage(): PlayerPrefs {
  const browserLang = (typeof navigator !== 'undefined' ? navigator.language : 'en')
    .toLowerCase()
    .slice(0, 2);
  const supported = AUDIO_LANGUAGES.map(l => l.code);
  const audioLang = supported.includes(browserLang) ? browserLang : 'en';
  return { ...DEFAULT_PREFS, audioLang };
}

// ─── Embed URL builders (delegating to provider registry) ─────────────────────

/**
 * Build an embed URL for a movie.
 * Delegates to the provider registry for URL generation.
 * Returns `null` if movieId is missing or falsy — callers must handle null.
 */
export function buildMovieEmbedUrl(
  movieId: number | undefined | null,
  audioLang = 'en',
  serverId = 'vidsrc',
): string | null {
  // ── Validation gate ──────────────────────────────────────────────────────
  if (!movieId || typeof movieId !== 'number' || isNaN(movieId)) {
    logValidationFailure('movie', movieId);
    return null;
  }

  const provider = getProvider(serverId);
  const url = provider.generateMovieUrl(movieId, audioLang);

  logEmbedUrl('movie', movieId, url, { provider: serverId });
  return url;
}

/**
 * Build an embed URL for a TV episode.
 * Delegates to the provider registry for URL generation.
 * Returns `null` if tvId, season, or episode is missing/falsy — callers must handle null.
 */
export function buildTVEmbedUrl(
  tvId: number | undefined | null,
  season: number | undefined | null,
  episode: number | undefined | null,
  audioLang = 'en',
  serverId = 'vidsrc',
): string | null {
  // ── Validation gate ──────────────────────────────────────────────────────
  if (!tvId || typeof tvId !== 'number' || isNaN(tvId)) {
    logValidationFailure('tv', tvId, season, episode);
    return null;
  }
  if (!season || typeof season !== 'number' || isNaN(season)) {
    logValidationFailure('tv', tvId, season, episode);
    return null;
  }
  if (!episode || typeof episode !== 'number' || isNaN(episode)) {
    logValidationFailure('tv', tvId, season, episode);
    return null;
  }

  const provider = getProvider(serverId);
  const url = provider.generateTVUrl(tvId, season, episode, audioLang);

  logEmbedUrl('tv', tvId, url, { season, episode, provider: serverId });
  return url;
}
