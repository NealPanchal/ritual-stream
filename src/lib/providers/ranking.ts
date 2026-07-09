/**
 * src/lib/providers/ranking.ts
 *
 * Adaptive provider ranking engine.
 *
 * Maintains per-session failure counts and latency data per provider.
 * On failure: increments penalty, temporarily demotes priority.
 * On success with low latency: promotes priority.
 *
 * Scores are stored in sessionStorage (reset per browser session).
 * Exports getAdaptiveRoster() for useStreamPlayer to use.
 */

import type { ProviderId, ProviderScore, SourceHealthReport } from './types';
import { PROVIDER_ROSTER } from './index';

// ─── Constants ────────────────────────────────────────────────────────────────

const SS_KEY = 'bs_provider_ranking';

/** How much a single failure adds to the penalty score */
const FAILURE_PENALTY = 50;

/** Penalty decays by this factor every 60 seconds */
const DECAY_INTERVAL_MS = 60_000;
const DECAY_FACTOR = 0.7;

/** Max latency weight in the score (ms mapped to 0–30) */
const LATENCY_WEIGHT_MAX = 30;
const LATENCY_SCALE_MS = 5000; // 5s = max penalty

// ─── In-memory state ──────────────────────────────────────────────────────────

let scores: Record<string, ProviderScore> = {};
let lastDecay = Date.now();

function initScores(): void {
  const fresh: Record<string, ProviderScore> = {};
  for (const id of PROVIDER_ROSTER) {
    fresh[id] = {
      failures: 0,
      avgLatencyMs: 0,
      lastFailureAt: 0,
      lastSuccessAt: 0,
      score: 0,
    };
  }
  scores = fresh;
}

// Load from sessionStorage on module init
function loadScores(): void {
  if (typeof window === 'undefined') {
    initScores();
    return;
  }
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (raw) {
      scores = JSON.parse(raw);
      // Ensure all providers exist (in case new ones were added)
      for (const id of PROVIDER_ROSTER) {
        if (!scores[id]) {
          scores[id] = {
            failures: 0,
            avgLatencyMs: 0,
            lastFailureAt: 0,
            lastSuccessAt: 0,
            score: 0,
          };
        }
      }
    } else {
      initScores();
    }
  } catch {
    initScores();
  }
}

function persistScores(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SS_KEY, JSON.stringify(scores));
  } catch {
    // quota exceeded — ignore
  }
}

// ─── Score computation ────────────────────────────────────────────────────────

function computeScore(s: ProviderScore, defaultPriority: number): number {
  // Base score from default priority (1–5 → 10–50)
  const basePriority = defaultPriority * 10;

  // Failure penalty: each failure adds FAILURE_PENALTY
  const failurePenalty = s.failures * FAILURE_PENALTY;

  // Latency penalty: 0–LATENCY_WEIGHT_MAX based on avg latency
  const latencyPenalty = s.avgLatencyMs > 0
    ? Math.min((s.avgLatencyMs / LATENCY_SCALE_MS) * LATENCY_WEIGHT_MAX, LATENCY_WEIGHT_MAX)
    : 0;

  // Recency bonus: if the provider succeeded recently (last 30s), slight boost
  const now = Date.now();
  const recencyBonus = (s.lastSuccessAt > 0 && now - s.lastSuccessAt < 30_000) ? -15 : 0;

  return basePriority + failurePenalty + latencyPenalty + recencyBonus;
}

function recomputeAll(): void {
  // Find default priorities from PROVIDER_ROSTER order
  for (let i = 0; i < PROVIDER_ROSTER.length; i++) {
    const id = PROVIDER_ROSTER[i];
    if (scores[id]) {
      scores[id].score = computeScore(scores[id], i + 1);
    }
  }
}

// ─── Decay ────────────────────────────────────────────────────────────────────

function applyDecay(): void {
  const now = Date.now();
  if (now - lastDecay < DECAY_INTERVAL_MS) return;

  for (const id of PROVIDER_ROSTER) {
    if (scores[id] && scores[id].failures > 0) {
      scores[id].failures = Math.max(0, Math.floor(scores[id].failures * DECAY_FACTOR));
    }
  }
  lastDecay = now;
  recomputeAll();
  persistScores();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Initialize the ranking engine. Call once on app mount.
 */
export function initRanking(): void {
  loadScores();
  recomputeAll();
}

/**
 * Record a provider failure. Increases penalty score and persists.
 */
export function recordFailure(providerId: ProviderId, reason?: string): void {
  applyDecay();

  if (!scores[providerId]) return;
  scores[providerId].failures += 1;
  scores[providerId].lastFailureAt = Date.now();

  recomputeAll();
  persistScores();
}

/**
 * Record a provider success. Resets some penalty and records latency.
 */
export function recordSuccess(providerId: ProviderId, latencyMs?: number): void {
  applyDecay();

  if (!scores[providerId]) return;

  // Reduce failure count on success (forgiveness)
  scores[providerId].failures = Math.max(0, scores[providerId].failures - 1);
  scores[providerId].lastSuccessAt = Date.now();

  // Update average latency with exponential moving average
  if (latencyMs != null && latencyMs > 0) {
    const prev = scores[providerId].avgLatencyMs;
    scores[providerId].avgLatencyMs = prev === 0
      ? latencyMs
      : Math.round(prev * 0.6 + latencyMs * 0.4);
  }

  recomputeAll();
  persistScores();
}

/**
 * Integrate health report data into ranking scores.
 * Called when health check results arrive.
 */
export function integrateHealthReport(report: SourceHealthReport): void {
  for (const id of PROVIDER_ROSTER) {
    const health = report[id];
    if (!health || !scores[id]) continue;

    // Update latency from health check
    if (health.latencyMs != null) {
      const prev = scores[id].avgLatencyMs;
      scores[id].avgLatencyMs = prev === 0
        ? health.latencyMs
        : Math.round(prev * 0.5 + health.latencyMs * 0.5);
    }

    // If provider is offline, treat as a failure
    if (health.status === 'offline') {
      scores[id].failures = Math.max(scores[id].failures, 2);
    }
  }

  recomputeAll();
  persistScores();
}

/**
 * Get the adaptively-ranked provider roster.
 * Returns provider IDs sorted by computed score (lower = better).
 */
export function getAdaptiveRoster(): ProviderId[] {
  applyDecay();

  const sorted = [...PROVIDER_ROSTER].sort((a, b) => {
    const scoreA = scores[a]?.score ?? Infinity;
    const scoreB = scores[b]?.score ?? Infinity;
    return scoreA - scoreB;
  });

  // Always force streamimdb to be first
  const streamImdbIdx = sorted.indexOf('streamimdb');
  if (streamImdbIdx > 0) {
    sorted.splice(streamImdbIdx, 1);
    sorted.unshift('streamimdb');
  }

  return sorted;
}

/**
 * Get the raw scores for all providers (for the debug panel).
 */
export function getProviderScores(): Readonly<Record<string, ProviderScore>> {
  return { ...scores };
}

/**
 * Reset all ranking data.
 */
export function resetRanking(): void {
  initScores();
  recomputeAll();
  persistScores();
}
