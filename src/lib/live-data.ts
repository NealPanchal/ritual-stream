/**
 * live-data.ts — Curated live sports event data
 *
 * Uses freely-available sport stream embed providers.
 * Thumbnails reference TMDB-style sport imagery via placehold.co.
 */

import { LiveEvent } from '@/components/LiveCard';

// ─── Sport categories ─────────────────────────────────────────────────────────
export const SPORT_CATEGORIES = [
  { id: 'all',        label: 'All Sports'   },
  { id: 'football',   label: 'Football'     },
  { id: 'basketball', label: 'Basketball'   },
  { id: 'cricket',    label: 'Cricket'      },
  { id: 'ufc',        label: 'UFC'          },
  { id: 'f1',         label: 'Formula 1'    },
  { id: 'wwe',        label: 'WWE'          },
  { id: 'esports',    label: 'eSports'      },
  { id: 'baseball',   label: 'Baseball'     },
  { id: 'hockey',     label: 'Hockey'       },
] as const;

export type SportCategory = typeof SPORT_CATEGORIES[number]['id'];

// ─── Live event catalog ───────────────────────────────────────────────────────
// Thumbnails: sport-branded placeholder images (replace with real CDN URLs)
export const LIVE_EVENTS: LiveEvent[] = [
  // ── Football ─────────────────────────────────────────────────────────────
  {
    id: 'football-1',
    title: 'Champions League: Real Madrid vs Manchester City',
    sport: 'football',
    league: 'UEFA Champions League',
    thumbnail: 'https://placehold.co/480x270/0f172a/3b82f6?text=Real+Madrid+vs+Man+City',
    quality: 'FHD',
    viewers: 128400,
    isLive: true,
    embedUrl: 'https://embedme.top/embed/football/real-madrid-vs-manchester-city/1',
  },
  {
    id: 'football-2',
    title: 'PSG vs Arsenal — UEFA Champions League',
    sport: 'football',
    league: 'UEFA Champions League',
    thumbnail: 'https://placehold.co/480x270/1e1b4b/6366f1?text=PSG+vs+Arsenal',
    quality: 'HD',
    viewers: 94200,
    isLive: true,
    embedUrl: 'https://embedme.top/embed/football/psg-vs-arsenal/1',
  },
  {
    id: 'football-3',
    title: 'Premier League: Liverpool vs Chelsea',
    sport: 'football',
    league: 'Premier League',
    thumbnail: 'https://placehold.co/480x270/7f1d1d/ef4444?text=Liverpool+vs+Chelsea',
    quality: 'FHD',
    viewers: 76800,
    isLive: true,
    embedUrl: 'https://embedme.top/embed/football/liverpool-vs-chelsea/1',
  },
  {
    id: 'football-4',
    title: 'La Liga: Barcelona vs Atletico Madrid',
    sport: 'football',
    league: 'La Liga',
    thumbnail: 'https://placehold.co/480x270/172554/3b82f6?text=Barca+vs+Atletico',
    quality: 'HD',
    viewers: 61000,
    isLive: false,
    embedUrl: '',
  },

  // ── Basketball ────────────────────────────────────────────────────────────
  {
    id: 'nba-1',
    title: 'NBA Finals: Lakers vs Celtics — Game 5',
    sport: 'basketball',
    league: 'NBA',
    thumbnail: 'https://placehold.co/480x270/292524/f97316?text=Lakers+vs+Celtics',
    quality: '4K',
    viewers: 210000,
    isLive: true,
    embedUrl: 'https://embedme.top/embed/basketball/lakers-vs-celtics/1',
  },
  {
    id: 'nba-2',
    title: 'Golden State Warriors vs Boston Celtics',
    sport: 'basketball',
    league: 'NBA',
    thumbnail: 'https://placehold.co/480x270/1c1917/fbbf24?text=Warriors+vs+Celtics',
    quality: 'FHD',
    viewers: 88000,
    isLive: true,
    embedUrl: 'https://embedme.top/embed/basketball/warriors-vs-celtics/1',
  },

  // ── Cricket ───────────────────────────────────────────────────────────────
  {
    id: 'cricket-1',
    title: 'IPL 2025: Mumbai Indians vs Chennai Super Kings',
    sport: 'cricket',
    league: 'IPL',
    thumbnail: 'https://placehold.co/480x270/0f2027/22d3ee?text=MI+vs+CSK',
    quality: 'FHD',
    viewers: 340000,
    isLive: true,
    embedUrl: 'https://embedme.top/embed/cricket/mi-vs-csk/1',
  },
  {
    id: 'cricket-2',
    title: 'Test Cricket: India vs England — Day 3',
    sport: 'cricket',
    league: 'Test Series',
    thumbnail: 'https://placehold.co/480x270/14532d/4ade80?text=India+vs+England',
    quality: 'HD',
    viewers: 195000,
    isLive: true,
    embedUrl: 'https://embedme.top/embed/cricket/india-vs-england/1',
  },

  // ── UFC ───────────────────────────────────────────────────────────────────
  {
    id: 'ufc-1',
    title: 'UFC 302: Jon Jones vs Stipe Miočić',
    sport: 'ufc',
    league: 'UFC',
    thumbnail: 'https://placehold.co/480x270/1a1a2e/c084fc?text=UFC+302',
    quality: 'FHD',
    viewers: 152000,
    isLive: true,
    embedUrl: 'https://embedme.top/embed/ufc/ufc-302/1',
  },
  {
    id: 'ufc-2',
    title: 'Fight Night: Poirier vs Gaethje',
    sport: 'ufc',
    league: 'UFC Fight Night',
    thumbnail: 'https://placehold.co/480x270/0c0a09/f43f5e?text=Fight+Night',
    quality: 'HD',
    viewers: 74000,
    isLive: false,
    embedUrl: '',
  },

  // ── Formula 1 ─────────────────────────────────────────────────────────────
  {
    id: 'f1-1',
    title: 'F1 Monaco Grand Prix 2025 — Race',
    sport: 'f1',
    league: 'Formula 1',
    thumbnail: 'https://placehold.co/480x270/0d1117/e11d48?text=F1+Monaco+GP',
    quality: '4K',
    viewers: 290000,
    isLive: true,
    embedUrl: 'https://embedme.top/embed/f1/monaco-gp/1',
  },
  {
    id: 'f1-2',
    title: 'British Grand Prix — Qualifying',
    sport: 'f1',
    league: 'Formula 1',
    thumbnail: 'https://placehold.co/480x270/0f0f0f/dc2626?text=British+GP+Qualifying',
    quality: 'FHD',
    viewers: 118000,
    isLive: false,
    embedUrl: '',
  },

  // ── WWE ───────────────────────────────────────────────────────────────────
  {
    id: 'wwe-1',
    title: 'WWE Monday Night RAW — Live',
    sport: 'wwe',
    league: 'WWE',
    thumbnail: 'https://placehold.co/480x270/1a0a0a/dc2626?text=WWE+RAW',
    quality: 'HD',
    viewers: 83000,
    isLive: true,
    embedUrl: 'https://embedme.top/embed/wwe/raw/1',
  },
  {
    id: 'wwe-2',
    title: 'WWE SummerSlam 2025',
    sport: 'wwe',
    league: 'WWE',
    thumbnail: 'https://placehold.co/480x270/0f0a00/f59e0b?text=SummerSlam+2025',
    quality: 'FHD',
    viewers: 0,
    isLive: false,
    embedUrl: '',
  },

  // ── eSports ───────────────────────────────────────────────────────────────
  {
    id: 'esports-1',
    title: 'The International 2025: Finals — Team Spirit vs Liquid',
    sport: 'esports',
    league: 'Dota 2 TI',
    thumbnail: 'https://placehold.co/480x270/020617/818cf8?text=TI+2025+Finals',
    quality: 'FHD',
    viewers: 450000,
    isLive: true,
    embedUrl: 'https://embedme.top/embed/esports/ti-finals/1',
  },
  {
    id: 'esports-2',
    title: 'CS2 Major Copenhagen — Semi Final',
    sport: 'esports',
    league: 'CS2 Major',
    thumbnail: 'https://placehold.co/480x270/0f172a/f59e0b?text=CS2+Major',
    quality: 'FHD',
    viewers: 220000,
    isLive: true,
    embedUrl: 'https://embedme.top/embed/esports/cs2-major/1',
  },

  // ── Hockey ────────────────────────────────────────────────────────────────
  {
    id: 'hockey-1',
    title: 'NHL Stanley Cup Finals: Avalanche vs Panthers',
    sport: 'hockey',
    league: 'NHL',
    thumbnail: 'https://placehold.co/480x270/0c1a3a/60a5fa?text=NHL+Finals',
    quality: 'FHD',
    viewers: 97000,
    isLive: true,
    embedUrl: 'https://embedme.top/embed/hockey/nhl-finals/1',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const getLiveNow = () => LIVE_EVENTS.filter(e => e.isLive);
export const getByCategory = (cat: SportCategory) =>
  cat === 'all' ? LIVE_EVENTS : LIVE_EVENTS.filter(e => e.sport === cat);
export const getEventById = (id: string) => LIVE_EVENTS.find(e => e.id === id);
