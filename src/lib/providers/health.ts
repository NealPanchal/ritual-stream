/**
 * src/lib/providers/health.ts
 *
 * Provider health checking extracted into the providers module.
 * Uses the provider registry instead of hardcoded URLs.
 *
 * Server-side: direct HEAD-fetch with AbortSignal.timeout
 * Client-side: calls /api/providers/health (avoids CORS)
 */

import { getAllProviders, PROVIDER_ROSTER } from './index';
import type { ProviderId, ProviderHealth, ProviderStatus, SourceHealthReport } from './types';

// ─── Thresholds ───────────────────────────────────────────────────────────────

const ONLINE_THRESHOLD_MS = 2000;
const SLOW_THRESHOLD_MS   = 5000;

// ─── In-memory cache (module-level singleton) ─────────────────────────────────

const CACHE_TTL_MS = 60_000; // 60 seconds

let cachedReport: SourceHealthReport | null = null;
let cacheTimestamp = 0;

export function getCachedHealth(): SourceHealthReport | null {
  if (!cachedReport) return null;
  if (Date.now() - cacheTimestamp > CACHE_TTL_MS) return null;
  return cachedReport;
}

export function setCachedHealth(report: SourceHealthReport): void {
  cachedReport = report;
  cacheTimestamp = Date.now();
}

// ─── Server-side probe ────────────────────────────────────────────────────────

/**
 * Probe a single provider URL via HEAD request (server-side only).
 * Classifies: online (<2 s), slow (2–5 s), offline (fail / >5 s).
 */
export async function probeProvider(url: string): Promise<ProviderHealth> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SLOW_THRESHOLD_MS);

    await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timer);
    const latencyMs = Date.now() - start;

    return {
      status: latencyMs <= ONLINE_THRESHOLD_MS ? 'online' : 'slow',
      latencyMs,
      checkedAt: new Date().toISOString(),
    };
  } catch {
    const latencyMs = Date.now() - start;
    return {
      status: 'offline',
      latencyMs,
      checkedAt: new Date().toISOString(),
    };
  }
}

/**
 * Probe all registered providers in parallel and return a full health report.
 * Called from the /api/providers/health route handler (server-side).
 */
export async function buildHealthReport(): Promise<SourceHealthReport> {
  const providers = getAllProviders();

  const results = await Promise.all(
    providers.map((p) => probeProvider(p.healthCheckUrl))
  );

  const report = {} as Record<string, ProviderHealth>;
  providers.forEach((p, i) => {
    report[p.id] = results[i];
  });

  const fullReport = {
    ...report,
    checkedAt: new Date().toISOString(),
  } as SourceHealthReport;

  setCachedHealth(fullReport);
  return fullReport;
}

// ─── Client-side helper ───────────────────────────────────────────────────────

/**
 * Fetch health data from our own API route (browser-safe, no CORS issues).
 * Falls back gracefully if the route is unreachable.
 */
export async function fetchSourceHealth(): Promise<SourceHealthReport | null> {
  try {
    const res = await fetch('/api/providers/health', { cache: 'no-store' });
    if (!res.ok) {
      // Try legacy endpoint
      const legacy = await fetch('/api/source-health', { cache: 'no-store' });
      if (!legacy.ok) return null;
      return legacy.json() as Promise<SourceHealthReport>;
    }
    return res.json() as Promise<SourceHealthReport>;
  } catch {
    return null;
  }
}

/**
 * Given a health report, return the first provider in the fallback roster
 * that is online or slow (not offline).
 */
export function pickBestProvider(
  report: SourceHealthReport | null,
  preferredOrder: readonly ProviderId[] = PROVIDER_ROSTER
): ProviderId {
  if (!report) return 'vidsrc'; // default if no health data
  for (const id of preferredOrder) {
    const health = report[id];
    if (health && (health.status === 'online' || health.status === 'slow')) {
      return id;
    }
  }
  // All offline — return first anyway and let the retry logic handle it
  return preferredOrder[0];
}
