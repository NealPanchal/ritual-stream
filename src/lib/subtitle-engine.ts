/**
 * src/lib/subtitle-engine.ts — SRT fetcher, parser, and sync engine
 *
 * Strategy:
 *  1. Search OpenSubtitles REST API for subtitles by TMDB ID + language
 *  2. Download the SRT/VTT file
 *  3. Parse into timed cue array { startMs, endMs, text }
 *  4. getCueAt(ms) returns the subtitle text for a given playback position
 *
 * Fallback: Returns empty cue array if no subtitles found.
 * API key: Configurable via NEXT_PUBLIC_OS_API_KEY env var.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SubtitleCue {
  startMs: number;
  endMs:   number;
  text:    string;
}

export type SubtitleStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'not-found'
  | 'error';

// ─── OpenSubtitles API ────────────────────────────────────────────────────────

const OS_API_BASE = 'https://api.opensubtitles.com/api/v1';
const OS_API_KEY  =
  process.env.NEXT_PUBLIC_OS_API_KEY ?? 'TptGlQG4YLydMf6ItSFtlhXbSpqS1bGO';

async function osSearch(params: {
  tmdb_id:   number;
  languages: string;
  type:      'movie' | 'episode';
  season_number?:  number;
  episode_number?: number;
}): Promise<{ fileId: number; lang: string } | null> {
  try {
    const query = new URLSearchParams({
      tmdb_id:   String(params.tmdb_id),
      languages: params.languages,
      type:      params.type,
      ...(params.season_number  !== undefined ? { season_number:  String(params.season_number)  } : {}),
      ...(params.episode_number !== undefined ? { episode_number: String(params.episode_number) } : {}),
    });

    const res = await fetch(`${OS_API_BASE}/subtitles?${query}`, {
      headers: {
        'Api-Key':      OS_API_KEY,
        'Content-Type': 'application/json',
        'User-Agent':   'RitualStream v1.0',
      },
    });

    if (!res.ok) return null;
    const data = await res.json();

    const first = data?.data?.[0];
    if (!first) return null;

    const fileId = first?.attributes?.files?.[0]?.file_id;
    const lang   = first?.attributes?.language;
    if (!fileId) return null;

    return { fileId, lang };
  } catch {
    return null;
  }
}

async function osDownload(fileId: number): Promise<string | null> {
  try {
    const res = await fetch(`${OS_API_BASE}/download`, {
      method: 'POST',
      headers: {
        'Api-Key':      OS_API_KEY,
        'Content-Type': 'application/json',
        'User-Agent':   'RitualStream v1.0',
      },
      body: JSON.stringify({ file_id: fileId }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const link = data?.link;
    if (!link) return null;

    // Fetch the actual SRT content
    const srtRes = await fetch(link);
    if (!srtRes.ok) return null;
    return srtRes.text();
  } catch {
    return null;
  }
}

// ─── SRT Parser ───────────────────────────────────────────────────────────────

/** Parse SRT timestamp "00:01:23,456" → milliseconds */
function parseSRTTime(ts: string): number {
  const clean = ts.trim().replace(',', '.');
  const parts = clean.split(':');
  if (parts.length !== 3) return 0;
  const [h, m, s] = parts.map(Number);
  return Math.round((h * 3600 + m * 60 + s) * 1000);
}

/** Parse a full SRT file string into SubtitleCue[] */
export function parseSRT(srt: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  // Split on blank lines
  const blocks = srt
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;

    // lines[0] = index (number), skip
    // lines[1] = "00:01:23,456 --> 00:01:25,789"
    const timeLine = lines[1];
    const timeMatch = timeLine.match(
      /(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2}[,\.]\d{3})/
    );
    if (!timeMatch) continue;

    const startMs = parseSRTTime(timeMatch[1]);
    const endMs   = parseSRTTime(timeMatch[2]);

    // lines[2..] = text (may be multi-line, strip HTML tags)
    const text = lines
      .slice(2)
      .join('\n')
      .replace(/<[^>]+>/g, '') // strip HTML
      .replace(/\{[^}]+\}/g, '') // strip ASS/SSA tags
      .trim();

    if (text) cues.push({ startMs, endMs, text });
  }

  return cues;
}

// ─── Main fetch function ──────────────────────────────────────────────────────

export async function fetchSubtitles(params: {
  tmdbId:     number;
  type:       'movie' | 'tv';
  langCode:   string;   // ISO 639-1 e.g. 'en', 'hi'
  season?:    number;
  episode?:   number;
}): Promise<{ cues: SubtitleCue[]; status: SubtitleStatus }> {
  const osLang = params.langCode === 'en-cc' ? 'en' : params.langCode;

  const result = await osSearch({
    tmdb_id:        params.tmdbId,
    languages:      osLang,
    type:           params.type === 'tv' ? 'episode' : 'movie',
    season_number:  params.season,
    episode_number: params.episode,
  });

  if (!result) return { cues: [], status: 'not-found' };

  const srt = await osDownload(result.fileId);
  if (!srt) return { cues: [], status: 'error' };

  const cues = parseSRT(srt);
  return { cues, status: cues.length > 0 ? 'ready' : 'not-found' };
}

// ─── Sync helper ──────────────────────────────────────────────────────────────

/** Return the cue active at `positionMs`, or null if none */
export function getCueAt(
  cues: SubtitleCue[],
  positionMs: number,
  offsetMs = 0,
): SubtitleCue | null {
  const adjusted = positionMs + offsetMs;
  return cues.find(c => adjusted >= c.startMs && adjusted <= c.endMs) ?? null;
}
