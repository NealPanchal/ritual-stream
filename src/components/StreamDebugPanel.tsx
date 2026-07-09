'use client';

/**
 * src/components/StreamDebugPanel.tsx
 *
 * Development-only floating debug panel showing full stream diagnostics.
 * Visible when:
 *   - process.env.NODE_ENV === 'development'
 *   - OR ?debug=1 in URL (allows opt-in in any environment)
 *
 * Shows: TMDB ID, content type, embed URL, provider status,
 *        current source, last error, retry info, log history,
 *        fallback history, adaptive ranking scores, iframe status.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bug,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';
import {
  PROVIDER_ROSTER,
  PROVIDER_LABELS,
  type ProviderId,
  type ProviderHealth,
} from '@/lib/providers';
import { getLogHistory, type LogEntry } from '@/lib/stream-logger';
import type { FailureReason } from '@/lib/stream-logger';
import type { FallbackEntry, ProviderScore } from '@/lib/providers/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StreamDebugPanelProps {
  tmdbId:          number | undefined | null;
  type:            'movie' | 'tv';
  season?:         number | null;
  episode?:        number | null;
  embedUrl:        string | null;
  currentProvider: ProviderId;
  providerHealth:  Partial<Record<ProviderId, ProviderHealth>>;
  retryCount:      number;
  failureReason:   FailureReason | null;
  error:           string | null;
  isLoading:       boolean;
  isLoaded:        boolean;
  fallbackHistory?: FallbackEntry[];
  providerScores?:  Readonly<Record<string, ProviderScore>>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    process.env.NODE_ENV === 'development' ||
    window.location.search.includes('debug=1')
  );
}

const STATUS_COLORS: Record<string, string> = {
  online:  'text-emerald-400',
  slow:    'text-yellow-400',
  offline: 'text-red-400',
  unknown: 'text-gray-500',
};

const STATUS_DOT: Record<string, string> = {
  online:  '🟢',
  slow:    '🟡',
  offline: '🔴',
  unknown: '⚪',
};

const LOG_LEVEL_COLORS: Record<string, string> = {
  info:  'text-blue-400',
  warn:  'text-yellow-400',
  error: 'text-red-400',
  debug: 'text-gray-500',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={copy} className="text-gray-600 hover:text-gray-400 transition-colors ml-1">
      {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StreamDebugPanel(props: StreamDebugPanelProps) {
  const [enabled,        setEnabled]        = useState(false);
  const [open,           setOpen]           = useState(true);
  const [logsOpen,       setLogsOpen]       = useState(false);
  const [rankingOpen,    setRankingOpen]    = useState(false);
  const [fallbackOpen,   setFallbackOpen]   = useState(false);
  const [logs,           setLogs]           = useState<readonly LogEntry[]>([]);

  // Check debug flag (client only)
  useEffect(() => {
    setEnabled(isDebugEnabled());
  }, []);

  // Refresh logs every second when panel is open
  useEffect(() => {
    if (!enabled || !open) return;
    const interval = setInterval(() => {
      setLogs(getLogHistory());
    }, 1000);
    setLogs(getLogHistory()); // immediate
    return () => clearInterval(interval);
  }, [enabled, open]);

  if (!enabled) return null;

  const {
    tmdbId, type, season, episode, embedUrl,
    currentProvider, providerHealth,
    retryCount, failureReason, error, isLoading, isLoaded,
    fallbackHistory = [],
    providerScores = {},
  } = props;

  // Iframe status label
  const iframeStatus = isLoaded ? 'loaded' : isLoading ? 'loading' : error ? 'error' : 'idle';
  const iframeStatusColor = isLoaded ? 'text-emerald-400' : isLoading ? 'text-yellow-400' : 'text-red-400';

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] w-80 font-mono text-xs"
      style={{ pointerEvents: 'auto' }}
    >
      <AnimatePresence>
        {open ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            className="rounded-xl border border-purple-500/30 bg-black/95 backdrop-blur-md shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border-b border-purple-500/20">
              <Bug size={12} className="text-purple-400" />
              <span className="text-purple-300 font-bold uppercase tracking-wider text-[10px]">
                Stream Debug Panel
              </span>
              <span className="ml-auto flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isLoaded ? 'bg-emerald-400' : isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'}`} />
                <span className={isLoaded ? 'text-emerald-400' : isLoading ? 'text-yellow-400' : 'text-red-400'}>
                  {iframeStatus}
                </span>
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-600 hover:text-gray-400 transition-colors ml-2"
              >
                <X size={12} />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 space-y-2.5 max-h-[70vh] overflow-y-auto">

              {/* Identity */}
              <section>
                <p className="text-gray-600 uppercase tracking-wider text-[9px] mb-1.5 font-bold">Identity</p>
                <div className="space-y-1">
                  <Row label="TMDB ID"   value={String(tmdbId ?? '—')} copyable />
                  <Row label="Type"      value={type} />
                  {type === 'tv' && (
                    <Row label="S/E" value={`S${season ?? '?'} E${episode ?? '?'}`} />
                  )}
                  <Row label="Iframe" value={iframeStatus} className={iframeStatusColor} />
                </div>
              </section>

              {/* Embed URL */}
              <section>
                <p className="text-gray-600 uppercase tracking-wider text-[9px] mb-1.5 font-bold">Embed URL</p>
                <div className="bg-gray-900 rounded-lg p-2 break-all text-gray-400 leading-relaxed">
                  {embedUrl
                    ? <><span>{embedUrl}</span><CopyButton text={embedUrl} /></>
                    : <span className="text-red-400">NULL — validation failed</span>
                  }
                </div>
              </section>

              {/* Current provider */}
              <section>
                <p className="text-gray-600 uppercase tracking-wider text-[9px] mb-1.5 font-bold">Current Source</p>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">{PROVIDER_LABELS[currentProvider] ?? currentProvider}</span>
                  <span className="text-gray-600 text-[10px]">
                    (retry {retryCount + 1}/3)
                  </span>
                </div>
              </section>

              {/* Provider health table */}
              <section>
                <p className="text-gray-600 uppercase tracking-wider text-[9px] mb-1.5 font-bold">Provider Status</p>
                <div className="space-y-1">
                  {PROVIDER_ROSTER.map((id) => {
                    const h = providerHealth[id];
                    const isActive = id === currentProvider;
                    return (
                      <div key={id} className={`flex items-center gap-2 py-0.5 ${isActive ? 'text-purple-300' : 'text-gray-500'}`}>
                        <span>{STATUS_DOT[h?.status ?? 'unknown']}</span>
                        <span className={isActive ? 'font-bold' : ''}>{PROVIDER_LABELS[id] ?? id}</span>
                        <span className={`ml-auto ${STATUS_COLORS[h?.status ?? 'unknown']}`}>
                          {h?.status ?? 'unknown'}
                        </span>
                        {h?.latencyMs != null && (
                          <span className="text-gray-700 text-[9px]">{h.latencyMs}ms</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Last error */}
              {(error || failureReason) && (
                <section>
                  <p className="text-gray-600 uppercase tracking-wider text-[9px] mb-1.5 font-bold">Last Error</p>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-red-400">
                    <p className="font-bold">{failureReason ?? 'unknown'}</p>
                    {error && <p className="text-red-400/70 mt-0.5 text-[10px] break-words">{error}</p>}
                  </div>
                </section>
              )}

              {/* Fallback history */}
              <section>
                <button
                  onClick={() => setFallbackOpen(v => !v)}
                  className="flex items-center gap-1.5 text-gray-600 hover:text-gray-400 transition-colors w-full"
                >
                  {fallbackOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  <span className="uppercase tracking-wider text-[9px] font-bold">
                    Fallback History ({fallbackHistory.length})
                  </span>
                </button>

                <AnimatePresence>
                  {fallbackOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-1.5"
                    >
                      <div className="max-h-32 overflow-y-auto space-y-0.5 bg-gray-950 rounded-lg p-2">
                        {fallbackHistory.length === 0 && (
                          <p className="text-gray-700">No fallbacks triggered.</p>
                        )}
                        {[...fallbackHistory].reverse().map((entry, i) => (
                          <div key={i} className="flex gap-2 leading-snug">
                            <span className="text-gray-800 flex-shrink-0 tabular-nums">
                              {new Date(entry.timestamp).toLocaleTimeString().slice(0, 8)}
                            </span>
                            <span className="text-orange-400 flex-shrink-0">
                              {PROVIDER_LABELS[entry.provider] ?? entry.provider}
                            </span>
                            <span className="text-gray-600 text-[10px]">→ {entry.reason}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* Adaptive ranking scores */}
              <section>
                <button
                  onClick={() => setRankingOpen(v => !v)}
                  className="flex items-center gap-1.5 text-gray-600 hover:text-gray-400 transition-colors w-full"
                >
                  {rankingOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  <span className="uppercase tracking-wider text-[9px] font-bold">
                    Adaptive Ranking
                  </span>
                </button>

                <AnimatePresence>
                  {rankingOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-1.5"
                    >
                      <div className="bg-gray-950 rounded-lg p-2 space-y-1">
                        {PROVIDER_ROSTER.map((id) => {
                          const s = providerScores[id];
                          if (!s) return null;
                          return (
                            <div key={id} className="flex items-center gap-2 text-gray-500">
                              <span className="w-20 truncate text-gray-400">
                                {PROVIDER_LABELS[id] ?? id}
                              </span>
                              <span className="text-[10px] tabular-nums">
                                score: <span className="text-purple-400 font-bold">{s.score.toFixed(0)}</span>
                              </span>
                              <span className="text-[10px] tabular-nums">
                                fail: <span className={s.failures > 0 ? 'text-red-400' : 'text-gray-700'}>{s.failures}</span>
                              </span>
                              <span className="text-[10px] tabular-nums">
                                lat: <span className="text-gray-600">{s.avgLatencyMs > 0 ? `${s.avgLatencyMs}ms` : '—'}</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* Log history */}
              <section>
                <button
                  onClick={() => setLogsOpen(v => !v)}
                  className="flex items-center gap-1.5 text-gray-600 hover:text-gray-400 transition-colors w-full"
                >
                  {logsOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  <span className="uppercase tracking-wider text-[9px] font-bold">
                    Log History ({logs.length})
                  </span>
                </button>

                <AnimatePresence>
                  {logsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-1.5"
                    >
                      <div className="max-h-40 overflow-y-auto space-y-0.5 bg-gray-950 rounded-lg p-2">
                        {logs.length === 0 && (
                          <p className="text-gray-700">No logs yet.</p>
                        )}
                        {[...logs].reverse().map((entry) => (
                          <div key={entry.id} className="flex gap-2 leading-snug">
                            <span className="text-gray-800 flex-shrink-0 tabular-nums">
                              {entry.timestamp.slice(11, 19)}
                            </span>
                            <span className={`flex-shrink-0 ${LOG_LEVEL_COLORS[entry.level]}`}>
                              [{entry.category}]
                            </span>
                            <span className="text-gray-500 break-all">{entry.message}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="toggle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-900/60 border border-purple-500/30 text-purple-300 hover:bg-purple-900/80 transition-all"
          >
            <Bug size={12} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Debug</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Row helper ───────────────────────────────────────────────────────────────

function Row({ label, value, copyable, className }: { label: string; value: string; copyable?: boolean; className?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-600 w-16 flex-shrink-0">{label}</span>
      <span className={`break-all ${className ?? 'text-gray-300'}`}>{value}</span>
      {copyable && <CopyButton text={value} />}
    </div>
  );
}
