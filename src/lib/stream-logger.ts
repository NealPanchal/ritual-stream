/**
 * src/lib/stream-logger.ts
 *
 * Centralised diagnostic logger for the BaseStream player pipeline.
 *
 * Active when:
 *   - NODE_ENV === 'development'  (always)
 *   - NEXT_PUBLIC_DEBUG_PLAYER=true  (opt-in in production)
 *
 * Keeps a ring-buffer of the last MAX_LOG_ENTRIES entries accessible
 * via getLogHistory() for the StreamDebugPanel.
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  id:        number;
  timestamp: string;
  level:     LogLevel;
  category:  string;
  message:   string;
  data?:     unknown;
}

// ─── Ring-buffer ──────────────────────────────────────────────────────────────

const MAX_LOG_ENTRIES = 200;
const logHistory: LogEntry[] = [];
let logCounter = 0;

function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_DEBUG_PLAYER === 'true' ||
    // Allow ?debug=1 in the URL to enable in any environment
    window.location.search.includes('debug=1')
  );
}

function record(level: LogLevel, category: string, message: string, data?: unknown): void {
  const entry: LogEntry = {
    id:        ++logCounter,
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    data,
  };

  logHistory.push(entry);
  if (logHistory.length > MAX_LOG_ENTRIES) {
    logHistory.shift();
  }

  if (!isDebugEnabled()) return;

  const prefix = `[BaseStream:${category}]`;
  switch (level) {
    case 'error': console.error(prefix, message, data ?? ''); break;
    case 'warn':  console.warn(prefix, message, data ?? '');  break;
    case 'debug': console.debug(prefix, message, data ?? ''); break;
    default:      console.log(prefix, message, data ?? '');   break;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns a snapshot of all recorded log entries (newest last). */
export function getLogHistory(): readonly LogEntry[] {
  return [...logHistory];
}

/** Clear the log ring-buffer. */
export function clearLogHistory(): void {
  logHistory.length = 0;
}

/**
 * Log a generated embed URL before it is rendered into an iframe.
 */
export function logEmbedUrl(
  type: 'movie' | 'tv',
  tmdbId: number | string | undefined | null,
  url: string | null,
  opts?: { season?: number; episode?: number; provider?: string }
): void {
  const meta = {
    type,
    tmdbId,
    url,
    season:   opts?.season,
    episode:  opts?.episode,
    provider: opts?.provider ?? 'unknown',
  };

  if (!url) {
    record('error', 'EmbedURL', `NULL embed URL generated for ${type} tmdbId=${tmdbId}`, meta);
    return;
  }

  if (url.includes('undefined') || url.includes('null')) {
    record('error', 'EmbedURL', `Malformed embed URL contains undefined/null literal: ${url}`, meta);
    return;
  }

  record('info', 'EmbedURL', `Generated embed URL for ${type} tmdbId=${tmdbId}: ${url}`, meta);
}

/**
 * Log when an iframe finishes loading (onLoad event).
 */
export function logIframeLoad(
  provider: string,
  url: string,
  durationMs: number
): void {
  record('info', 'IframeLoad', `iframe loaded — provider=${provider} (${durationMs}ms)`, { provider, url, durationMs });
}

/**
 * Log a received postMessage from the player iframe.
 */
export function logPostMessage(origin: string, data: unknown): void {
  record('debug', 'PostMessage', `postMessage from ${origin}`, data);
}

/**
 * Log a source/provider failure with classification.
 */
export function logSourceFailure(
  provider: string,
  reason: FailureReason,
  detail?: { url?: string; statusCode?: number; message?: string }
): void {
  record('error', 'SourceFailure', `Provider "${provider}" failed — reason: ${reason}`, {
    provider,
    reason,
    ...detail,
  });
}

/**
 * Log a provider fallback switch.
 */
export function logProviderSwitch(
  fromProvider: string,
  toProvider: string,
  attempt: number
): void {
  record('warn', 'Fallback', `Switching provider: ${fromProvider} → ${toProvider} (attempt ${attempt})`, {
    from: fromProvider,
    to: toProvider,
    attempt,
  });
}

/**
 * Log a retry attempt with backoff info.
 */
export function logRetry(
  provider: string,
  attempt: number,
  maxAttempts: number,
  backoffMs: number
): void {
  record('warn', 'Retry', `Retry ${attempt}/${maxAttempts} for provider "${provider}" — backoff ${backoffMs}ms`, {
    provider,
    attempt,
    maxAttempts,
    backoffMs,
  });
}

/**
 * Log URL validation failure.
 */
export function logValidationFailure(
  type: 'movie' | 'tv',
  tmdbId: unknown,
  season?: unknown,
  episode?: unknown
): void {
  record('error', 'Validation', `URL validation failed — missing required fields`, {
    type,
    tmdbId,
    season,
    episode,
    hasTmdbId: !!tmdbId,
    hasSeason: !!season,
    hasEpisode: !!episode,
  });
}

// ─── Failure reason taxonomy ──────────────────────────────────────────────────

export type FailureReason =
  | 'empty_url'
  | 'null_tmdb_id'
  | 'null_season'
  | 'null_episode'
  | 'malformed_url'
  | 'http_403'
  | 'http_404'
  | 'iframe_blocked'
  | 'provider_offline'
  | 'iframe_error_event'
  | 'postmessage_error'
  | 'timeout'
  | 'unknown';

export function classifyFailure(error: unknown, url?: string): FailureReason {
  if (!url) return 'empty_url';
  if (url.includes('undefined') || url.includes('null')) return 'malformed_url';

  if (typeof error === 'string') {
    const e = error.toLowerCase();
    if (e.includes('403'))            return 'http_403';
    if (e.includes('404'))            return 'http_404';
    if (e.includes('blocked') || e.includes('x-frame-options')) return 'iframe_blocked';
    if (e.includes('offline') || e.includes('network'))         return 'provider_offline';
    if (e.includes('timeout'))        return 'timeout';
  }

  return 'unknown';
}
