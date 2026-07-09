'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, ThumbsUp, Share2, ArrowLeft, Star, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useMovieDetails } from '@/lib/tmdb';
import ContentRow from '@/components/ContentRow';
import SkeletonLoader from '@/components/SkeletonLoader';
import { addToWatchHistory } from '@/utils/storage';
import { useAccess } from '@/hooks/useAccess';

import dynamic from 'next/dynamic';
import { usePlayerStore } from '@/store/playerStore';
import { fetchSubtitles, SubtitleCue } from '@/lib/subtitle-engine';
import type { SubtitleStatus } from '@/lib/subtitle-engine';

import { PlayerShell } from '@/components/player/PlayerShell';
import { ProviderManager } from '@/components/player/ProviderManager';

const SubtitleOverlay = dynamic(() => import('@/components/player/SubtitleOverlay').then(mod => mod.SubtitleOverlay), { ssr: false });
const PlayerControls = dynamic(() => import('@/components/player/PlayerControls').then(mod => mod.PlayerControls), { ssr: false });

// Reliability stack
import { useStreamPlayer } from '@/hooks/useStreamPlayer';

export default function MovieDetailPage() {
  const { address: walletAddress } = useAccount();
  const params  = useParams();
  const router = useRouter();
  const movieId = params.id as string;
  const { hasAccess } = useAccess(false, walletAddress);
  const { data: movie, isLoading, error } = useMovieDetails(movieId);

  const [showPlayer,    setShowPlayer]    = useState(false);
  const [playerLoading, setPlayerLoading] = useState(false);

  // ── Language / subtitle state ─────────────────────────────────────────────
  const {
    audioLang, subtitleLang, subtitleEnabled, server,
    setIsPlaying, reset: resetPlayer,
  } = usePlayerStore();

  const [subtitleCues,   setSubtitleCues]   = useState<SubtitleCue[]>([]);
  const [subtitleStatus, setSubtitleStatus] = useState<SubtitleStatus>('idle');
  const [playStartMs,    setPlayStartMs]    = useState<number | null>(null);

  // ── Stream reliability hook ───────────────────────────────────────────────
  const stream = useStreamPlayer({
    tmdbId:   movie?.id ?? null,
    type:     'movie',
    audioLang,
  });

  // When the server preference changes in the player store, sync to the hook
  // by resetting to the user's chosen provider (best-effort — hook fallback
  // may override this if that provider is unhealthy).
  useEffect(() => {
    if (showPlayer && server) {
      stream.switchProvider(server as any);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server]);

  // ── Watch history ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (movie) {
      addToWatchHistory({
        id:           movie.id,
        title:        movie.title,
        media_type:   'movie',
        poster_path:  movie.poster_path,
        backdrop_path:movie.backdrop_path,
        vote_average: movie.vote_average,
      }, walletAddress);
    }
  }, [movie, walletAddress]);

  // ── Load subtitles AFTER playback starts (never blocks video startup) ──────
  useEffect(() => {
    if (!showPlayer || !subtitleEnabled || !movie) return;
    // Only fetch subtitles once playback is confirmed healthy
    if (stream.providerState !== 'PLAYING' && stream.providerState !== 'READY') return;

    let cancelled = false;
    setSubtitleStatus('loading');
    setSubtitleCues([]);

    fetchSubtitles({
      tmdbId:   movie.id,
      type:     'movie',
      langCode: subtitleLang,
    }).then(({ cues, status }) => {
      if (cancelled) return;
      setSubtitleCues(cues);
      setSubtitleStatus(status);
    });

    return () => { cancelled = true; };
  }, [showPlayer, subtitleEnabled, subtitleLang, movie, stream.providerState]);

  const handlePlay = useCallback(() => {
    if (!hasAccess) {
      router.push('/unlock');
      return;
    }
    setPlayerLoading(true);
    setShowPlayer(true);
  }, [hasAccess, router]);

  const hasAutoPlayedRef = useRef(false);

  // Instantly open the player overlay if the user already has an active pass (only once)
  useEffect(() => {
    if (movie && hasAccess && !showPlayer && !hasAutoPlayedRef.current) {
      hasAutoPlayedRef.current = true;
      setPlayerLoading(true);
      setShowPlayer(true);
    }
  }, [movie, hasAccess, showPlayer]);

  const handlePlayerLoad = useCallback(() => {
    setPlayerLoading(false);
    setPlayStartMs(performance.now());
    setIsPlaying(true);
  }, []);

  useEffect(() => {
    if (stream.providerState === 'PLAYING' || stream.providerState === 'READY') {
      handlePlayerLoad();
    }
  }, [stream.providerState, handlePlayerLoad]);

  const handlePlayerError = useCallback(() => {
    stream.handleIframeError();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = useCallback(() => {
    setShowPlayer(false);
    setIsPlaying(false);
    setPlayStartMs(null);
    setSubtitleCues([]);
    setSubtitleStatus('idle');
    resetPlayer();
  }, [setIsPlaying, resetPlayer]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-black">
        <div className="relative h-[70vh] mb-8"><SkeletonLoader type="hero" count={1} /></div>
        <div className="container mx-auto px-4"><SkeletonLoader type="row" count={2} /></div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-base-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Movie Not Found</h1>
          <p className="text-gray-400 mb-6">The movie you're looking for doesn't exist.</p>
          <Link href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-base-blue text-white rounded-lg hover:bg-base-blue-hover transition-colors">
            <ArrowLeft size={20} /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null;
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-movie.jpg';

  return (
    <div className="min-h-screen bg-base-black font-base">

      {/* ── Fullscreen Player Overlay ── */}
      <AnimatePresence>
        {showPlayer && (
          <PlayerShell
            title={movie.title}
            onClose={handleClose}
            renderControls={(isIdle) => (
              <>
                <SubtitleOverlay cues={subtitleCues} playStartMs={playStartMs} />
                <PlayerControls 
                  subtitleStatus={subtitleStatus} 
                  currentProvider={stream.currentProvider}
                  providerHealth={stream.providerHealth}
                  switchProvider={stream.switchProvider}
                  isIdle={isIdle}
                />
              </>
            )}
          >
            <ProviderManager
              stream={stream}
              playerLoading={playerLoading}
              backdropUrl={backdropUrl}
              posterUrl={posterUrl}
              title={movie.title}
              iframeKeyPrefix="movie"
            />
          </PlayerShell>
        )}
      </AnimatePresence>

      {/* ── Hero Banner ── */}
      <section className="relative min-h-[75vh] flex items-end pb-12">
        {backdropUrl && (
          <div className="absolute inset-0">
            <img src={backdropUrl} alt={movie.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          </div>
        )}

        <div className="relative container mx-auto px-6">
          <motion.div
            className="flex flex-col md:flex-row gap-8 items-end md:items-center"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            {/* Poster */}
            <motion.div
              className="flex-shrink-0 hidden md:block"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <img src={posterUrl} alt={movie.title}
                className="w-48 lg:w-56 rounded-xl shadow-2xl border border-white/10" />
            </motion.div>

            {/* Info */}
            <div className="flex-1">
              <motion.div className="flex flex-wrap gap-2 mb-3"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                {movie.genres?.slice(0, 3).map((genre: any) => (
                  <span key={genre.id}
                    className="text-xs bg-white/10 border border-white/20 text-gray-300 rounded-full px-3 py-1">
                    {genre.name}
                  </span>
                ))}
              </motion.div>

              <motion.h1
                className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                {movie.title}
              </motion.h1>

              <motion.div className="flex flex-wrap items-center gap-4 mb-5 text-sm"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                <span className="flex items-center gap-1.5 text-yellow-400 font-semibold">
                  <Star size={14} fill="currentColor" />
                  {movie.vote_average?.toFixed(1)}
                </span>
                {movie.release_date && (
                  <span className="text-gray-400">
                    {new Date(movie.release_date).getFullYear()}
                  </span>
                )}
                {movie.runtime && (
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <Clock size={13} />
                    {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                  </span>
                )}
                <span className="border border-gray-600 text-gray-400 px-1.5 py-0.5 rounded text-xs">
                  {movie.original_language?.toUpperCase()}
                </span>
              </motion.div>

              {movie.tagline && (
                <motion.p className="text-gray-400 italic mb-4 text-base"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
                  "{movie.tagline}"
                </motion.p>
              )}

              <motion.p className="text-gray-300 leading-relaxed mb-8 max-w-2xl line-clamp-3"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                {movie.overview}
              </motion.p>

              <motion.div className="flex flex-wrap gap-3"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
                <motion.button
                  onClick={handlePlay}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2.5 px-8 py-3.5 bg-white text-black rounded-lg font-bold text-base hover:bg-gray-100 transition-colors shadow-lg">
                  <Play size={20} fill="black" /> Play Now
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 px-6 py-3.5 bg-gray-700/70 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-gray-600/80 transition-colors">
                  <Plus size={18} /> My List
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 px-6 py-3.5 bg-gray-700/70 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-gray-600/80 transition-colors">
                  <ThumbsUp size={18} /> Like
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 px-6 py-3.5 bg-gray-700/70 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-gray-600/80 transition-colors">
                  <Share2 size={18} /> Share
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Movie stats */}
      <div className="container mx-auto px-6 py-8">
        <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          {[
            { label: 'Budget',  value: movie.budget  ? `$${(movie.budget / 1e6).toFixed(0)}M`  : 'N/A' },
            { label: 'Revenue', value: movie.revenue ? `$${(movie.revenue / 1e6).toFixed(0)}M` : 'N/A' },
            { label: 'Status',  value: movie.status  || 'N/A' },
            { label: 'Votes',   value: movie.vote_count?.toLocaleString() ?? 'N/A' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <span className="text-gray-400 text-xs uppercase tracking-wide block mb-1">{label}</span>
              <span className="text-white font-semibold">{value}</span>
            </div>
          ))}
        </motion.div>

        {movie.similar?.results && movie.similar.results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <ContentRow title="Similar Movies" items={movie.similar.results} loading={false} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
