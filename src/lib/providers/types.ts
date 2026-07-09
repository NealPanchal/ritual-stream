/**
 * src/lib/providers/types.ts
 *
 * Unified interface for all streaming providers.
 * Each provider module implements this contract, enabling:
 *  - Polymorphic URL generation
 *  - Health checking via the registry
 *  - Dynamic roster ordering (adaptive ranking)
 */

// ─── Provider status / health ─────────────────────────────────────────────────

export type ProviderStatus = 'online' | 'slow' | 'offline' | 'unknown';

export interface ProviderHealth {
  status: ProviderStatus;
  latencyMs: number | null;
  /** ISO timestamp of last check */
  checkedAt?: string;
}

// ─── Core provider interface ──────────────────────────────────────────────────

export interface StreamProvider {
  /** Unique machine identifier (e.g. 'vidsrc', 'streamimdb', 'embedsu') */
  id: string;

  /** Human-readable display name */
  name: string;

  /** Default priority (lower = higher priority). Used as initial ordering. */
  priority: number;

  /** Whether this provider supports movie embeds */
  supportsMovie: boolean;

  /** Whether this provider supports TV episode embeds */
  supportsTV: boolean;

  /** Root domain used for health-check HEAD requests */
  healthCheckUrl: string;

  /**
   * Generate an embed URL for a movie.
   * @param tmdbId  TMDB movie ID
   * @param audioLang  ISO 639-1 language code (default 'en')
   * @returns Fully-qualified embed URL
   */
  generateMovieUrl(tmdbId: number, audioLang?: string): string;

  /**
   * Generate an embed URL for a TV episode.
   * @param tmdbId   TMDB TV show ID
   * @param season   Season number (1-indexed)
   * @param episode  Episode number (1-indexed)
   * @param audioLang  ISO 639-1 language code (default 'en')
   * @returns Fully-qualified embed URL
   */
  generateTVUrl(tmdbId: number, season: number, episode: number, audioLang?: string): string;
}

// ─── Provider ID type ─────────────────────────────────────────────────────────

/**
 * All known provider IDs.
 * This is the source of truth — adding a new provider means adding it here
 * and creating a module in providers/.
 *
 * Approved provider order (priority-based):
 *  1. VidSrc       (primary default)
 *  2. StreamIMDb
 *  3. Embed.su
 *  4. 2Embed
 *  5. SuperEmbed
 *  6. MultiEmbed
 *  7. Backup Stream
 */
export type ProviderId =
  | 'vidsrc'
  | 'streamimdb'
  | 'embedsu'
  | 'twoembed'
  | 'superembed'
  | 'multiembed'
  | 'backup';

// ─── Health report ────────────────────────────────────────────────────────────

export type SourceHealthReport = Record<ProviderId, ProviderHealth> & {
  checkedAt: string;
};

// ─── Ranking types ────────────────────────────────────────────────────────────

export interface ProviderScore {
  /** Number of recent failures */
  failures: number;
  /** Average latency in ms (from health checks) */
  avgLatencyMs: number;
  /** Timestamp of last failure */
  lastFailureAt: number;
  /** Timestamp of last success */
  lastSuccessAt: number;
  /** Computed priority score (lower = better) */
  score: number;
}

export interface FallbackEntry {
  provider: ProviderId;
  reason: string;
  timestamp: number;
}
