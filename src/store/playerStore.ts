'use client';

/**
 * src/store/playerStore.ts — Zustand store for player language preferences
 *
 * Single source of truth for:
 * - Audio language selection
 * - Subtitle language + enabled state
 * - Subtitle style customization
 * - Playback timer (for subtitle sync since we can't read iframe currentTime)
 * - Playback state preservation across provider switches
 *
 * All mutations auto-persist to localStorage via savePrefs().
 */

import { create } from 'zustand';
import {
  PlayerPrefs,
  SubtitleStyle,
  loadPrefs,
  savePrefs,
  DEFAULT_PREFS,
} from '@/lib/player-prefs';

interface PlayerState extends PlayerPrefs {
  // Playback timer (estimated position for subtitle sync)
  playbackMs:    number;
  isPlaying:     boolean;
  syncOffsetMs:  number;   // manual ±offset nudge in ms

  // Playback state preservation (across provider switches)
  currentTimestamp: number;  // estimated current time in seconds
  volume:          number;   // 0–1
  playbackSpeed:   number;   // 0.25–2


  // Actions
  setAudioLang:        (lang: string) => void;
  setSubtitleLang:     (lang: string) => void;
  setSubtitleEnabled:  (v: boolean) => void;
  setSubtitleStyle:    (style: Partial<SubtitleStyle>) => void;
  setServer:           (server: string) => void;
  setPlaybackMs:       (ms: number) => void;
  setIsPlaying:        (v: boolean) => void;
  nudgeSync:           (deltaMs: number) => void;
  setCurrentTimestamp:  (ts: number) => void;
  setVolume:           (v: number) => void;
  setPlaybackSpeed:    (s: number) => void;
  /** Snapshot current playback state before a provider switch */
  snapshotPlaybackState: () => { timestamp: number; volume: number; speed: number };
  reset:               () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  // Load initial prefs from localStorage
  const initial = typeof window !== 'undefined' ? loadPrefs() : DEFAULT_PREFS;

  return {
    ...initial,
    playbackMs:       0,
    isPlaying:        false,
    syncOffsetMs:     0,
    currentTimestamp:  0,
    volume:           1,
    playbackSpeed:    1,

    setAudioLang: (lang) => {
      set({ audioLang: lang });
      savePrefs({ audioLang: lang });
    },

    setSubtitleLang: (lang) => {
      set({ subtitleLang: lang, subtitleEnabled: lang !== 'off' });
      savePrefs({ subtitleLang: lang, subtitleEnabled: lang !== 'off' });
    },

    setSubtitleEnabled: (v) => {
      set({ subtitleEnabled: v });
      savePrefs({ subtitleEnabled: v });
    },

    setSubtitleStyle: (style) => {
      const next = { ...get().subtitleStyle, ...style };
      set({ subtitleStyle: next });
      savePrefs({ subtitleStyle: next });
    },

    setServer: (server) => {
      set({ server });
      savePrefs({ server });
    },

    setPlaybackMs:  (ms) => set({ playbackMs: ms }),
    setIsPlaying:   (v)  => set({ isPlaying: v }),

    nudgeSync: (deltaMs) =>
      set((s) => ({ syncOffsetMs: s.syncOffsetMs + deltaMs })),

    setCurrentTimestamp: (ts) => set({ currentTimestamp: ts }),
    setVolume:          (v)  => set({ volume: Math.max(0, Math.min(1, v)) }),
    setPlaybackSpeed:   (s)  => set({ playbackSpeed: Math.max(0.25, Math.min(2, s)) }),

    snapshotPlaybackState: () => {
      const state = get();
      return {
        timestamp: state.currentTimestamp,
        volume:    state.volume,
        speed:     state.playbackSpeed,
      };
    },


    reset: () => {
      set({
        ...initial,
        playbackMs: 0,
        isPlaying: false,
        syncOffsetMs: 0,
        currentTimestamp: 0,
        volume: 1,
        playbackSpeed: 1,
      });
    },
  };
});

