/**
 * src/lib/stream-health.ts
 *
 * ⚠️  COMPATIBILITY SHIM — delegates to src/lib/providers/health.ts
 *
 * This file exists to maintain backward compatibility with imports
 * that reference the old module path. All logic has been moved to
 * the provider registry (src/lib/providers/).
 */

// Re-export everything from the new provider health module
export {
  getCachedHealth,
  setCachedHealth,
  probeProvider,
  buildHealthReport,
  fetchSourceHealth,
  pickBestProvider,
} from './providers/health';

// Re-export types and roster from the provider registry
export {
  PROVIDER_ROSTER,
  PROVIDER_LABELS,
  KNOWN_PLAYER_ORIGINS,
  type ProviderId,
  type ProviderHealth,
  type ProviderStatus,
  type SourceHealthReport,
} from './providers';

/**
 * @deprecated Use imports from '@/lib/providers' instead.
 * Provider probe URLs — now derived from the provider registry.
 */
import { getAllProviders } from './providers';

export const PROVIDER_PROBE_URLS: Record<string, string> = (() => {
  const urls: Record<string, string> = {};
  for (const p of getAllProviders()) {
    urls[p.id] = p.healthCheckUrl;
  }
  return urls;
})();
