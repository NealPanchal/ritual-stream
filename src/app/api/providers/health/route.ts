/**
 * src/app/api/providers/health/route.ts
 *
 * GET /api/providers/health
 *
 * Server-side HEAD-checks all streaming providers and returns a JSON
 * health report. Results are cached in-memory for 60 s.
 *
 * Response shape:
 * {
 *   "vidsrc":     { "status": "online",  "latency": 120 },
 *   "streamimdb": { "status": "online",  "latency": 180 },
 *   "embedsu":    { "status": "online",  "latency": 150 },
 *   "twoembed":   { "status": "online",  "latency": 210 },
 *   "superembed": { "status": "slow",    "latency": 900 },
 *   "multiembed": { "status": "online",  "latency": 155 },
 *   "backup":     { "status": "online",  "latency": 300 },
 *   "checkedAt":  "2026-06-09T07:12:00.000Z"
 * }
 */

import { type NextRequest } from 'next/server';
import {
  getCachedHealth,
  buildHealthReport,
} from '@/lib/providers/health';
import { PROVIDER_ROSTER } from '@/lib/providers';
import type { SourceHealthReport } from '@/lib/providers/types';

export const dynamic = 'force-dynamic'; // Never cache at CDN level

export async function GET(_req: NextRequest): Promise<Response> {
  // Try the in-memory cache first (60 s TTL)
  const cached = getCachedHealth();
  if (cached) {
    return Response.json(formatResponse(cached), {
      headers: {
        'Cache-Control':               'no-store',
        'X-Provider-Health-Cache':     'HIT',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Run fresh probes
  try {
    const report: SourceHealthReport = await buildHealthReport();
    return Response.json(formatResponse(report), {
      headers: {
        'Cache-Control':               'no-store',
        'X-Provider-Health-Cache':     'MISS',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    // If probes themselves blow up, return a degraded response
    const fallback: Record<string, unknown> = { checkedAt: new Date().toISOString() };
    for (const id of PROVIDER_ROSTER) {
      fallback[id] = { status: 'unknown', latency: null };
    }
    return Response.json(fallback, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
}

/**
 * Format the health report for the public API shape.
 * Maps latencyMs → latency for cleaner external consumption.
 */
function formatResponse(report: SourceHealthReport): Record<string, unknown> {
  const result: Record<string, unknown> = { checkedAt: report.checkedAt };

  for (const id of PROVIDER_ROSTER) {
    const health = report[id];
    if (health) {
      result[id] = {
        status:  health.status,
        latency: health.latencyMs,
      };
    } else {
      result[id] = { status: 'unknown', latency: null };
    }
  }

  return result;
}
