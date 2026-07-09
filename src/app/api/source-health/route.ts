/**
 * src/app/api/source-health/route.ts
 *
 * GET /api/source-health
 *
 * LEGACY ENDPOINT — delegates to the new /api/providers/health.
 * Kept for backward compatibility with any clients that reference
 * the old path.
 */

import { type NextRequest } from 'next/server';
import {
  getCachedHealth,
  buildHealthReport,
} from '@/lib/providers/health';
import { PROVIDER_ROSTER } from '@/lib/providers';
import type { SourceHealthReport } from '@/lib/providers/types';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest): Promise<Response> {
  // Try the in-memory cache first (60 s TTL)
  const cached = getCachedHealth();
  if (cached) {
    return Response.json(cached, {
      headers: {
        'Cache-Control':               'no-store',
        'X-Source-Health-Cache':       'HIT',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Run fresh probes
  try {
    const report: SourceHealthReport = await buildHealthReport();
    return Response.json(report, {
      headers: {
        'Cache-Control':               'no-store',
        'X-Source-Health-Cache':       'MISS',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    // If probes blow up, return a degraded response
    const fallback: Record<string, unknown> = {
      checkedAt: new Date().toISOString(),
    };
    for (const id of PROVIDER_ROSTER) {
      fallback[id] = { status: 'unknown', latencyMs: null };
    }
    return Response.json(fallback, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
}
