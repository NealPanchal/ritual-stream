'use client';

/**
 * src/hooks/useStreamPlayer.ts
 *
 * Core streaming hook — OTT-grade playback reliability stack:
 *
 *  1. URL validation — returns null for bad TMDB IDs / season / episode
 *  2. Instant playback — mounts primary provider immediately, no blocking
 *  3. Background health check — feeds ranking engine for future sessions
 *  4. 5-second smart timeout — only triggers failover if NOT healthy
 *  5. Playback health detection — locks provider once playback confirmed
 *  6. Provider cache — per-title localStorage for instant replay startup
 *  7. postMessage listener for player events
 *  8. iframe onError / onLoad detection
 *  9. Fallback history tracking for the debug panel
 * 10. Integration with adaptive ranking (recordSuccess / recordFailure)
 * 11. Playback state snapshot for provider switches
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildMovieEmbedUrl, buildTVEmbedUrl } from '@/lib/player-prefs';
import {
  PROVIDER_ROSTER,
  KNOWN_PLAYER_ORIGINS,
  type ProviderId,
  type ProviderHealth,
  type SourceHealthReport,
} from '@/lib/providers';
import {
  fetchSourceHealth,
} from '@/lib/providers/health';
import {
  initRanking,
  getAdaptiveRoster,
  recordFailure as rankRecordFailure,
  recordSuccess as rankRecordSuccess,
  integrateHealthReport,
  getProviderScores,
} from '@/lib/providers/ranking';
import type { FallbackEntry, ProviderScore } from '@/lib/providers/types';
import {
  logIframeLoad,
  logPostMessage,
  logSourceFailure,
  logProviderSwitch,
  classifyFailure,
  FailureReason,
} from '@/lib/stream-logger';
import { usePlayerStore } from '@/store/playerStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StreamPlayerOptions {
  tmdbId:   number | undefined | null;
  type:     'movie' | 'tv';
  season?:  number | null;
  episode?: number | null;
  audioLang?: string;
}

export type ProviderState = 'IDLE' | 'LOADING' | 'READY' | 'PLAYING' | 'BUFFERING' | 'FAILED' | 'SWITCHING';

export interface StreamPlayerState {
  /** The currently active embed URL (null = cannot play). */
  embedUrl:        string | null;
  /** True while loading the iframe or waiting on a retry. */
  isLoading:       boolean;
  /** True once the iframe has fired onLoad without error. */
  isLoaded:        boolean;
  /** Human-readable error message, null when no error. */
  error:           string | null;
  /** Machine-readable failure reason for last error. */
  failureReason:   FailureReason | null;
  /** Which provider is currently active. */
  currentProvider: ProviderId;
  /** Health status of all providers (null until first check). */
  providerHealth:  Partial<Record<ProviderId, ProviderHealth>>;
  /** Retry attempt within current provider (1–3). */
  retryCount:      number;
  /** Seconds remaining in retry countdown (0 = attempting now). */
  retryCountdown:  number;
  /** Whether we've exhausted ALL providers — true = completely failed. */
  exhausted:       boolean;
  /** When the current iframe started loading (performance.now()). */
  loadStartMs:     number | null;
  /** History of all fallback switches in this session. */
  fallbackHistory: FallbackEntry[];
  /** Adaptive ranking scores for the debug panel. */
  providerScores:  Readonly<Record<string, ProviderScore>>;
  /** Toast message for non-blocking UI notifications (e.g., 'Switching to backup source…') */
  toastMessage:    string | null;
  /** Current state of the provider in the fallback engine */
  providerState:   ProviderState;
}

export interface StreamPlayerActions {
  /** Manually trigger a retry (resets retryCount for current provider). */
  retry: () => void;
  /** Force-switch to a specific provider. */
  switchProvider: (provider: ProviderId) => void;
  /** Called by the iframe onLoad event. */
  handleIframeLoad: () => void;
  /** Called by the iframe onError event. */
  handleIframeError: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Smart timeout: 5 seconds before considering failover */
const IFRAME_TIMEOUT_MS  = 5000;

const PROVIDER_CACHE_KEY = 'ritualstream_provider_cache';

function getCachedProvider(tmdbId: number | null | undefined, type: 'movie' | 'tv', season?: number | null, episode?: number | null): ProviderId | null {
  if (!tmdbId || typeof window === 'undefined') return null;
  try {
    const cache = JSON.parse(localStorage.getItem(PROVIDER_CACHE_KEY) || '{}');
    const key = type === 'movie' ? `movie_${tmdbId}` : `tv_${tmdbId}_s${season}e${episode}`;
    return cache[key] || null;
  } catch {
    return null;
  }
}

function setCachedProvider(tmdbId: number | null | undefined, type: 'movie' | 'tv', season: number | null | undefined, episode: number | null | undefined, provider: ProviderId) {
  if (!tmdbId || typeof window === 'undefined') return;
  try {
    const cache = JSON.parse(localStorage.getItem(PROVIDER_CACHE_KEY) || '{}');
    const key = type === 'movie' ? `movie_${tmdbId}` : `tv_${tmdbId}_s${season}e${episode}`;
    cache[key] = provider;
    localStorage.setItem(PROVIDER_CACHE_KEY, JSON.stringify(cache));
  } catch { /* quota exceeded — ignore */ }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStreamPlayer(
  opts: StreamPlayerOptions
): StreamPlayerState & StreamPlayerActions {
  const { tmdbId, type, season, episode, audioLang = 'en' } = opts;

  // ── Adaptive roster ─────────────────────────────────────────────────────
  const [roster, setRoster] = useState<ProviderId[]>(() => {
    if (typeof window !== 'undefined') {
      initRanking();
      const adaptive = getAdaptiveRoster();
      const cached = getCachedProvider(tmdbId, type, season, episode);
      if (cached && cached !== 'streamimdb' && adaptive.includes(cached as ProviderId)) {
        // Put streamimdb first, then the cached provider, then the rest
        const filtered = adaptive.filter(p => p !== cached && p !== 'streamimdb');
        return ['streamimdb', cached as ProviderId, ...filtered];
      }
      return adaptive;
    }
    return [...PROVIDER_ROSTER];
  });

  const [providerIndex,   setProviderIndex]   = useState(0);
  const [isLoading,       setIsLoading]       = useState(true);
  const [isLoaded,        setIsLoaded]        = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [failureReason,   setFailureReason]   = useState<FailureReason | null>(null);
  const [exhausted,       setExhausted]       = useState(false);
  const [providerHealth,  setProviderHealth]  = useState<Partial<Record<ProviderId, ProviderHealth>>>({});
  const [loadStartMs,     setLoadStartMs]     = useState<number | null>(null);
  const [fallbackHistory, setFallbackHistory] = useState<FallbackEntry[]>([]);
  const [providerScores,  setProviderScores]  = useState<Readonly<Record<string, ProviderScore>>>({});
  const [toastMessage,    setToastMessage]    = useState<string | null>(null);
  const [providerState,   setProviderState]   = useState<ProviderState>('LOADING');
  const [providerLocked,  setProviderLocked]  = useState(false);

  const currentProvider = roster[providerIndex] ?? 'streamimdb';

  // ── Build current embed URL (memoized) ──────────────────────────────────
  const currentTimestampRef = useRef(0);

  // Keep ref in sync with store
  useEffect(() => {
    const unsub = usePlayerStore.subscribe((state) => {
      currentTimestampRef.current = state.currentTimestamp;
    });
    return unsub;
  }, []);

  const embedUrl = useMemo((): string | null => {
    if (!tmdbId) return null;
    let url: string | null = null;
    if (type === 'movie') {
      url = buildMovieEmbedUrl(tmdbId, audioLang, currentProvider);
    } else if (type === 'tv') {
      url = buildTVEmbedUrl(tmdbId, season ?? null, episode ?? null, audioLang, currentProvider);
    }

    // Append timestamp for seamless resume if a switch occurred
    if (url && currentTimestampRef.current > 0) {
      const sep = url.includes('?') ? '&' : '?';
      url += `${sep}t=${Math.floor(currentTimestampRef.current)}`;
    }
    return url;
  }, [tmdbId, type, season, episode, audioLang, currentProvider]);

  // Reset state if content changes
  const prevContentRef = useRef({ tmdbId, season, episode, type });
  useEffect(() => {
    const prev = prevContentRef.current;
    if (prev.tmdbId !== tmdbId || prev.season !== season || prev.episode !== episode || prev.type !== type) {
      prevContentRef.current = { tmdbId, season, episode, type };
      
      // Full reset for new content
      setIsLoading(true);
      setIsLoaded(false);
      setError(null);
      setToastMessage(null);
      setExhausted(false);
      setFailureReason(null);
      setProviderLocked(false);
      setProviderState('LOADING');
      setLoadStartMs(performance.now());
      setFallbackHistory([]);
      
      // Recalculate roster and check cache
      const cached = getCachedProvider(tmdbId, type, season, episode);
      if (cached && roster.includes(cached as ProviderId)) {
        setProviderIndex(roster.indexOf(cached as ProviderId));
      } else {
        setProviderIndex(0);
      }
    }
  }, [tmdbId, season, episode, type, roster]);

  // Refs for timers
  const iframeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearIframeTimeout = useCallback(() => {
    if (iframeTimeoutRef.current) {
      clearTimeout(iframeTimeoutRef.current);
      iframeTimeoutRef.current = null;
    }
    if (mediaTimeoutRef.current) {
      clearTimeout(mediaTimeoutRef.current);
      mediaTimeoutRef.current = null;
    }
  }, []);

  // ── Background health check (non-blocking) ─────────────────────────────
  useEffect(() => {
    // Fire and forget — never blocks playback
    fetchSourceHealth().then((report: SourceHealthReport | null) => {
      if (!report) return;
      const health: Partial<Record<ProviderId, ProviderHealth>> = {};
      for (const id of roster) {
        if (report[id]) health[id] = report[id];
      }
      setProviderHealth(health);

      // Feed health data into the adaptive ranking engine for future sessions
      integrateHealthReport(report);
      setProviderScores(getProviderScores());
      // Note: we do NOT re-order the roster mid-session to avoid disrupting playback
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 5-second smart iframe load timeout ──────────────────────────────────
  useEffect(() => {
    if (!embedUrl || isLoaded || !isLoading || providerLocked) return;

    clearIframeTimeout();
    iframeTimeoutRef.current = setTimeout(() => {
      // Only trigger failover if playback is NOT healthy
      if (!isLoaded && !providerLocked) {
        const reason: FailureReason = 'timeout';
        logSourceFailure(currentProvider, reason, {
          url: embedUrl,
          message: `iframe load timeout after ${IFRAME_TIMEOUT_MS}ms`,
        });
        triggerFallback(reason);
      }
    }, IFRAME_TIMEOUT_MS);

    return () => clearIframeTimeout();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedUrl, isLoaded, isLoading, currentProvider, providerIndex, providerLocked]);

  // ── postMessage listener ────────────────────────────────────────────────
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      logPostMessage(event.origin, event.data);

      // Only process messages from known player origins
      if (!KNOWN_PLAYER_ORIGINS.some(o => event.origin === o || event.origin.endsWith(o.replace(/^https?:\/\//, '')))) {
        return;
      }

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        if (data?.type === 'PLAYER_EVENT') {
          const { event: playerEvent, data: eventData } = data;

          if (playerEvent === 'ready' || playerEvent === 'loadedmetadata' || playerEvent === 'playing' || playerEvent === 'timeupdate') {
            setIsLoading(false);
            setIsLoaded(true);
            setError(null);
            setToastMessage(null);
            clearIframeTimeout();
            setProviderState('PLAYING');
            // Lock provider once playback confirmed healthy
            setProviderLocked(true);
            setCachedProvider(tmdbId, type, season, episode, currentProvider);
          }

          if (playerEvent === 'error') {
            // Don't switch if provider is locked (playback was healthy)
            if (providerLocked) return;
            const msg: string = eventData?.message ?? 'Player error';
            logSourceFailure(currentProvider, 'postmessage_error', { message: msg, url: embedUrl ?? undefined });
            setFailureReason('postmessage_error');
            triggerFallback('postmessage_error');
            setProviderState('FAILED');
          }
        }
      } catch {
        // Non-JSON message — ignore
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProvider, embedUrl, providerLocked]);

  // ── Trigger fallback (instant switch to next provider) ──────────────────
  const triggerFallback = useCallback((reason: FailureReason) => {
    // Never switch if provider is locked (playback is healthy)
    if (providerLocked) return;

    setFailureReason(reason);
    setIsLoaded(false);
    clearIframeTimeout();
    setProviderState('FAILED');

    // Record failure in adaptive ranking
    rankRecordFailure(currentProvider, reason);
    setProviderScores(getProviderScores());

    // Instant switch to next provider
    const nextIndex = providerIndex + 1;

    if (nextIndex >= roster.length) {
      // All providers exhausted
      setExhausted(true);
      setIsLoading(false);
      setError('All streaming sources are currently unavailable. Please try again later.');
      logSourceFailure('vidsrc' as ProviderId, 'provider_offline', { message: 'All providers exhausted' });
      return;
    }

    const nextProvider = roster[nextIndex];
    logProviderSwitch(currentProvider, nextProvider, nextIndex);

    // Track fallback history
    setFallbackHistory(prev => [...prev, {
      provider: currentProvider,
      reason,
      timestamp: Date.now(),
    }]);

    setProviderIndex(nextIndex);
    setIsLoading(true);
    setError(null);
    setToastMessage('Switching to backup source…');
    setProviderState('SWITCHING');
    setLoadStartMs(performance.now());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProvider, providerIndex, roster, providerLocked]);

  // ── iframe event handlers ───────────────────────────────────────────────
  const handleIframeLoad = useCallback(() => {
    const durationMs = loadStartMs ? Math.round(performance.now() - loadStartMs) : 0;
    logIframeLoad(currentProvider, embedUrl ?? '', durationMs);
    clearIframeTimeout();
    setIsLoading(false);
    setIsLoaded(true);
    setError(null);
    setToastMessage(null);
    setProviderState('READY');
    
    // We do NOT lock the provider yet! We wait for postMessage 'playing' or 'timeupdate'.
    // If the video hangs inside the loaded iframe, we will trigger fallback after 15s.
    mediaTimeoutRef.current = setTimeout(() => {
      // Use the latest providerLocked state (via functional update hack, but since we can't easily, we just check ref or let triggerFallback check it)
      // Actually, triggerFallback checks `providerLocked` from its dependencies.
      // But inside a setTimeout, it captures the closure. We can rely on `triggerFallback` checking `providerLocked`.
      // Actually, triggerFallback is re-created when providerLocked changes. We should just call it directly.
      triggerFallback('timeout');
    }, 15000);

    // Record success in adaptive ranking (for HTML load at least)
    rankRecordSuccess(currentProvider, durationMs);
    setProviderScores(getProviderScores());
  }, [currentProvider, embedUrl, loadStartMs, clearIframeTimeout, triggerFallback]);

  const handleIframeError = useCallback(() => {
    // Don't trigger fallback if provider is locked (playback was healthy)
    if (providerLocked) return;
    const reason = classifyFailure('iframe error event', embedUrl ?? undefined);
    logSourceFailure(currentProvider, reason, { url: embedUrl ?? undefined });
    triggerFallback(reason);
  }, [currentProvider, embedUrl, triggerFallback, providerLocked]);

  // ── Manual retry ────────────────────────────────────────────────────────
  const retry = useCallback(() => {
    clearIframeTimeout();
    setIsLoading(true);
    setIsLoaded(false);
    setError(null);
    setToastMessage(null);
    setExhausted(false);
    setFailureReason(null);
    setProviderLocked(false);
    setProviderState('LOADING');
    setLoadStartMs(performance.now());
  }, [clearIframeTimeout]);

  // ── Force-switch provider ───────────────────────────────────────────────
  const switchProvider = useCallback((provider: ProviderId) => {
    const idx = roster.indexOf(provider);
    if (idx === -1) {
      // Provider not in current roster — append and switch
      setRoster(prev => [...prev, provider]);
      setProviderIndex(roster.length); // will be the appended index
    } else {
      setProviderIndex(idx);
    }
    clearIframeTimeout();
    setIsLoading(true);
    setIsLoaded(false);
    setError(null);
    setToastMessage(null);
    setExhausted(false);
    setFailureReason(null);
    setProviderLocked(false);
    setProviderState('SWITCHING');
    setLoadStartMs(performance.now());
  }, [roster, clearIframeTimeout]);

  // ── Set initial loadStartMs ─────────────────────────────────────────────
  useEffect(() => {
    setLoadStartMs(performance.now());
  }, []); // Only on mount

  // Cleanup timers on unmount
  useEffect(() => () => {
    clearIframeTimeout();
  }, [clearIframeTimeout]);

  return {
    embedUrl,
    isLoading,
    isLoaded,
    error,
    failureReason,
    currentProvider,
    providerHealth,
    retryCount: 0,       // Kept for UI compatibility
    retryCountdown: 0,   // Kept for UI compatibility
    exhausted,
    loadStartMs,
    fallbackHistory,
    providerScores,
    toastMessage,
    providerState,
    retry,
    switchProvider,
    handleIframeLoad,
    handleIframeError,
  };
}
