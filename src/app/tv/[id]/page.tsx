'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, ThumbsUp, Share2, ArrowLeft, Star, Clock, Calendar, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useTVDetails } from '@/lib/tmdb';
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

export default function TVDetailPage() {
  const { address: walletAddress } = useAccount();
  const params       = useParams();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const tvId         = params.id as string;
  const { hasAccess } = useAccess(false, walletAddress);
  const { data: tvShow, isLoading, error } = useTVDetails(tvId);

  const [selectedSeason,  setSelectedSeason]  = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [showPlayer,      setShowPlayer]      = useState(false);
  const [playerLoading,   setPlayerLoading]   = useState(false);

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
    tmdbId:   tvShow?.id ?? null,
    type:     'tv',
    season:   selectedSeason,
    episode:  selectedEpisode,
    audioLang,
  });

  // Sync server preference from playerStore → hook
  useEffect(() => {
    if (showPlayer && server) {
      stream.switchProvider(server as any);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server]);

  useEffect(() => {
    const s = searchParams.get('season');
    const e = searchParams.get('episode');
    if (s) setSelectedSeason(parseInt(s));
    if (e) setSelectedEpisode(parseInt(e));
  }, [searchParams]);

  useEffect(() => {
    if (tvShow) {
      addToWatchHistory({
        id:           tvShow.id,
        title:        tvShow.name,
        media_type:   'tv',
        poster_path:  tvShow.poster_path,
        backdrop_path:tvShow.backdrop_path,
        vote_average: tvShow.vote_average,
        season:       selectedSeason,
        episode:      selectedEpisode,
      }, walletAddress);
    }
  }, [tvShow, selectedSeason, selectedEpisode, walletAddress]);

  // Load subtitles AFTER playback starts (never blocks video startup)
  useEffect(() => {
    if (!showPlayer || !subtitleEnabled || !tvShow) return;
    // Only fetch subtitles once playback is confirmed healthy
    if (stream.providerState !== 'PLAYING' && stream.providerState !== 'READY') return;

    let cancelled = false;
    setSubtitleStatus('loading');
    setSubtitleCues([]);

    fetchSubtitles({
      tmdbId:   tvShow.id,
      type:     'tv',
      langCode: subtitleLang,
      season:   selectedSeason,
      episode:  selectedEpisode,
    }).then(({ cues, status }) => {
      if (cancelled) return;
      setSubtitleCues(cues);
      setSubtitleStatus(status);
    });

    return () => { cancelled = true; };
  }, [showPlayer, subtitleEnabled, subtitleLang, tvShow, selectedSeason, selectedEpisode, stream.providerState]);

  const handlePlay = useCallback((s?: number, e?: number) => {
    if (!hasAccess) {
      router.push('/unlock');
      return;
    }
    if (s !== undefined) setSelectedSeason(s);
    if (e !== undefined) setSelectedEpisode(e);
    setPlayerLoading(true);
    setShowPlayer(true);
  }, [hasAccess, router]);



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

  if (error || !tvShow) {
    return (
      <div className="min-h-screen bg-base-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">TV Show Not Found</h1>
          <p className="text-gray-400 mb-6">The TV show you're looking for doesn't exist.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-base-blue text-white rounded-lg hover:bg-base-blue-hover transition-colors">
            <ArrowLeft size={20} /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const currentSeasonData = tvShow.seasons?.find((s: any) => s.season_number === selectedSeason);
  const backdropUrl = tvShow.backdrop_path ? `https://image.tmdb.org/t/p/original${tvShow.backdrop_path}` : null;
  const posterUrl   = tvShow.poster_path   ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}` : '/placeholder-movie.jpg';

  return (
    <div className="min-h-screen bg-base-black text-white font-base">

      {/* ── Fullscreen Player Overlay ── */}
      <AnimatePresence>
        {showPlayer && (
          <PlayerShell
            title={tvShow.name}
            subtitle={`S${selectedSeason} E${selectedEpisode}`}
            onClose={handleClose}
            topRightContent={
              <select
                value={selectedEpisode}
                onChange={(e) => {
                  const ep = parseInt(e.target.value);
                  setSelectedEpisode(ep);
                  handlePlay(selectedSeason, ep);
                }}
                className="bg-black/60 text-white text-sm font-bold px-3 py-1.5 rounded border border-white/20 outline-none backdrop-blur-md cursor-pointer hover:bg-white/10 transition-colors"
              >
                {Array.from({ length: currentSeasonData?.episode_count || 0 }, (_, i) => i + 1).map(ep => (
                  <option key={ep} value={ep} className="bg-gray-900">Episode {ep}</option>
                ))}
              </select>
            }
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
              title={`${tvShow.name} S${selectedSeason}E${selectedEpisode}`}
              iframeKeyPrefix={`tv-s${selectedSeason}-e${selectedEpisode}`}
            />
          </PlayerShell>
        )}
      </AnimatePresence>

      {/* ── Hero Banner ── */}
      <section className="relative min-h-[75vh] flex items-end pb-12 overflow-hidden">
        {backdropUrl && (
          <div className="absolute inset-0">
            <img src={backdropUrl} alt={tvShow.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-base-black via-base-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-base-black via-base-black/20 to-transparent" />
          </div>
        )}
        <div className="relative container mx-auto px-6">
          <motion.div className="flex flex-col md:flex-row gap-8 items-end md:items-center"
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <div className="flex-shrink-0 hidden md:block w-56 lg:w-64">
              <img src={posterUrl} alt={tvShow.name} className="w-full rounded-2xl shadow-2xl border border-white/10" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-4">
                {tvShow.genres?.map((g: any) => (
                  <span key={g.id}
                    className="text-xs font-bold px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full border border-white/10 transition-colors uppercase tracking-wider">
                    {g.name}
                  </span>
                ))}
              </div>
              <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">{tvShow.name}</h1>
              <div className="flex flex-wrap items-center gap-6 mb-6 text-base font-medium">
                <span className="flex items-center gap-1.5 text-yellow-500">
                  <Star size={20} fill="currentColor" /> {tvShow.vote_average?.toFixed(1)}
                </span>
                <span className="flex items-center gap-1.5 text-gray-300">
                  <Calendar size={18} /> {new Date(tvShow.first_air_date).getFullYear()}
                </span>
                <span className="flex items-center gap-1.5 text-gray-300">
                  <Clock size={18} /> {tvShow.number_of_seasons} Seasons
                </span>
                <span className="px-2 py-0.5 border border-base-blue text-base-blue rounded text-xs font-black uppercase">TV-MA</span>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-3xl line-clamp-3">{tvShow.overview}</p>
              <div className="flex flex-wrap gap-4">
                <motion.button onClick={() => handlePlay()}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3 px-10 py-4 bg-white text-black rounded-xl font-black text-xl hover:bg-gray-200 transition-colors shadow-2xl">
                  <Play size={24} fill="black" /> Play Episode 1
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-8 py-4 bg-gray-800/80 backdrop-blur-md text-white rounded-xl font-bold text-lg border border-white/10 hover:bg-gray-700 transition-colors">
                  <Plus size={24} /> My List
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Episodes Section ── */}
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h2 className="text-3xl font-black tracking-tight">Episodes</h2>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">Select Season</span>
            <select
              value={selectedSeason}
              onChange={e => { setSelectedSeason(parseInt(e.target.value)); setSelectedEpisode(1); }}
              className="bg-gray-900 text-white font-bold px-6 py-3 rounded-xl border border-white/10 focus:ring-2 focus:ring-base-blue transition-all outline-none"
            >
              {tvShow.seasons?.map((s: any) => (
                <option key={s.id} value={s.season_number}>{s.name || `Season ${s.season_number}`}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: currentSeasonData?.episode_count || 0 }, (_, i) => i + 1).map(ep => (
            <motion.div key={ep} whileHover={{ y: -5 }}
              className={`flex flex-col bg-gray-900 border ${selectedEpisode === ep ? 'border-base-blue' : 'border-white/5'} rounded-2xl overflow-hidden hover:bg-gray-800 transition-all group cursor-pointer`}
              onClick={() => handlePlay(selectedSeason, ep)}
            >
              <div className="aspect-video relative overflow-hidden bg-black">
                <img src={`https://image.tmdb.org/t/p/w500${tvShow.backdrop_path}`}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt={`Episode ${ep}`} />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-base-blue flex items-center justify-center text-white scale-75 group-hover:scale-100 transition-transform">
                    <Play size={24} fill="currentColor" />
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 bg-black/80 px-2 py-1 rounded text-xs font-bold text-white border border-white/10">
                  Episode {ep}
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-white mb-2 line-clamp-1">{tvShow.name} - Episode {ep}</h4>
                <p className="text-gray-400 text-sm line-clamp-2">Start watching this episode now with cinematic quality.</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Similar TV Shows */}
      {tvShow.similar?.results && tvShow.similar.results.length > 0 && (
        <div className="container mx-auto px-6 py-12">
          <ContentRow title="Customers also watched" items={tvShow.similar.results} loading={false} />
        </div>
      )}
    </div>
  );
}
