/**
 * src/lib/providers/index.ts
 *
 * Central provider registry.
 *
 * Single source of truth for:
 *  - Which providers exist (7 approved providers)
 *  - Default fallback ordering
 *  - Lookup by ID
 *  - Known postMessage origins (for iframe event handling)
 *  - Provider domain list (for DNS preconnect)
 *
 * Approved Provider Order (Priority-Based):
 *  1. VidSrc       (Primary Default)
 *  2. StreamIMDb
 *  3. Embed.su
 *  4. 2Embed
 *  5. SuperEmbed
 *  6. MultiEmbed
 *  7. Backup Stream
 */

import type { StreamProvider, ProviderId } from './types';
import { vidsrcProvider } from './vidsrc';
import { streamimdbProvider } from './streamimdb';
import { embedsuProvider } from './embedsu';
import { twoembedProvider } from './twoembed';
import { superembedProvider } from './superembed';
import { multiembedProvider } from './multiembed';
import { backupProvider } from './backup';

// ─── Provider instances ───────────────────────────────────────────────────────

const ALL_PROVIDERS: StreamProvider[] = [
  vidsrcProvider,
  streamimdbProvider,
  embedsuProvider,
  twoembedProvider,
  superembedProvider,
  multiembedProvider,
  backupProvider,
];

// ─── Registry map (id → provider) ────────────────────────────────────────────

const PROVIDER_MAP = new Map<string, StreamProvider>(
  ALL_PROVIDERS.map((p) => [p.id, p])
);

// ─── Ordered fallback roster (default priority) ───────────────────────────────

/**
 * Default provider ordering by priority.
 * The adaptive ranking engine may re-order this dynamically.
 */
export const PROVIDER_ROSTER: readonly ProviderId[] = ALL_PROVIDERS
  .sort((a, b) => a.priority - b.priority)
  .map((p) => p.id as ProviderId);

// ─── Lookup helpers ───────────────────────────────────────────────────────────

/**
 * Get a provider instance by ID.
 * Returns the VidSrc provider as fallback if the ID is unknown.
 */
export function getProvider(id: string): StreamProvider {
  return PROVIDER_MAP.get(id) ?? streamimdbProvider;
}

/**
 * Get all registered provider instances, sorted by default priority.
 */
export function getAllProviders(): readonly StreamProvider[] {
  return ALL_PROVIDERS;
}

/**
 * Check if a provider ID is valid.
 */
export function isValidProviderId(id: string): id is ProviderId {
  return PROVIDER_MAP.has(id);
}

// ─── Provider metadata helpers ────────────────────────────────────────────────

/**
 * Human-readable labels for all providers.
 */
export const PROVIDER_LABELS: Record<ProviderId, string> = {
  vidsrc:     'VidSrc',
  streamimdb: 'StreamIMDb',
  embedsu:    'Embed.su',
  twoembed:   '2Embed',
  superembed: 'SuperEmbed',
  multiembed: 'MultiEmbed',
  backup:     'Backup Stream',
};

/**
 * Known postMessage origins from provider player iframes.
 * Used by useStreamPlayer to validate incoming events.
 */
export const KNOWN_PLAYER_ORIGINS: readonly string[] = [
  'https://vidsrc.to',
  'https://vidsrc.me',
  'https://streamimdb.ru',
  'https://embed.su',
  'https://www.2embed.cc',
  'https://2embed.cc',
  'https://multiembed.mov',
  'https://www.vidking.net',
  'https://vidking.net',
];

/**
 * All provider domains for DNS preconnect hints.
 */
export const PROVIDER_DOMAINS: readonly string[] = ALL_PROVIDERS.map((p) => {
  try {
    return new URL(p.healthCheckUrl).origin;
  } catch {
    return p.healthCheckUrl;
  }
});

/**
 * Stream server descriptors for the UI server selector.
 * Derived from the provider registry — no manual sync needed.
 */
export const STREAM_SERVERS = ALL_PROVIDERS.map((p) => ({
  id: p.id,
  name: PROVIDER_LABELS[p.id as ProviderId] ?? p.name,
  description: getProviderDescription(p.id as ProviderId),
}));

function getProviderDescription(id: ProviderId): string {
  const descriptions: Record<ProviderId, string> = {
    vidsrc:     'Primary server with highest reliability',
    streamimdb: 'Fast secondary server with broad coverage',
    embedsu:    'High-quality streams with quick loading',
    twoembed:   'Alternative server with extensive library',
    superembed: 'Multi-host aggregator with auto fallbacks',
    multiembed: 'Premium source with multi-quality support',
    backup:     'Emergency backup server',
  };
  return descriptions[id] ?? 'Streaming provider';
}

// Re-export types for convenience
export type { StreamProvider, ProviderId, ProviderHealth, ProviderStatus, SourceHealthReport } from './types';
