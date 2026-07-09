'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize2, SkipForward } from 'lucide-react';
import { PlayerProps, PlayerEvent } from '@/types';
import { saveWatchProgress } from '@/utils/storage';

const Player = ({ id, type, season, episode, title, onProgress, onEnded }: PlayerProps) => {
  const { address } = useAccount();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Build VidKing embed URL
  const buildEmbedUrl = useCallback(() => {
    const baseUrl = 'https://www.vidking.net';
    
    if (type === 'movie') {
      let url = `${baseUrl}/embed/movie/${id}`;
      
      // Add saved progress if exists
      const savedProgress = typeof window !== 'undefined' ? localStorage.getItem(`movie_${id}_progress`) : null;
      if (savedProgress) {
        url += `?progress=${savedProgress}`;
      }
      
      // Add parameters
      const params = new URLSearchParams(savedProgress ? {} : undefined);
      params.set('color', '0052FF');
      params.set('autoPlay', 'true');
      
      return url + (savedProgress ? '&' : '?') + params.toString();
    } else if (type === 'tv' && season && episode) {
      let url = `${baseUrl}/embed/tv/${id}/${season}/${episode}`;
      
      // Add saved progress if exists
      const savedProgress = typeof window !== 'undefined' ? localStorage.getItem(`tv_${id}_s${season}_e${episode}_progress`) : null;
      if (savedProgress) {
        url += `?progress=${savedProgress}`;
      }
      
      // Add parameters
      const params = new URLSearchParams(savedProgress ? {} : undefined);
      params.set('color', '0052FF');
      params.set('autoPlay', 'true');
      params.set('nextEpisode', 'true');
      params.set('episodeSelector', 'true');
      
      return url + (savedProgress ? '&' : '?') + params.toString();
    }
    
    return null;
  }, [id, type, season, episode]);

  // Save progress to localStorage and Supabase
  const saveProgress = useCallback((currentTime: number, duration: number) => {
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    
    // Save to wallet-specific storage
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      saveWatchProgress(id, type, currentTime, duration, season, episode, address);
    }
    
    // Save to database (if user is authenticated)
    // This will be implemented with Supabase integration
  }, [id, type, season, episode, address]);

  // Handle player events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== 'https://www.vidking.net' && event.origin !== 'https://vidking.net') return;

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        if (data.type === 'PLAYER_EVENT') {
          const { event: playerEvent, data: eventData } = data;
          
          switch (playerEvent) {
            case 'ready':
              setIsLoading(false);
              setError(null);
              break;
              
            case 'timeupdate':
              if (eventData.currentTime && eventData.duration) {
                const percentage = (eventData.currentTime / eventData.duration) * 100;
                setProgress(percentage);
                setCurrentTime(eventData.currentTime);
                setDuration(eventData.duration);
                
                // Save progress every 10 seconds
                if (Math.floor(eventData.currentTime) % 10 === 0) {
                  saveProgress(eventData.currentTime, eventData.duration);
                  onProgress?.(percentage);
                }
              }
              break;
              
            case 'play':
              setIsPlaying(true);
              break;
              
            case 'pause':
              setIsPlaying(false);
              break;
              
            case 'ended':
              setIsPlaying(false);
              // Mark as completed
              saveProgress(0, 0);
              onEnded?.();
              break;
              
            case 'error':
              setError(eventData.message || 'An error occurred');
              setIsLoading(false);
              setIsPlaying(false);
              break;
          }
        }
      } catch (error) {
        console.error('Error parsing player message:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onProgress, onEnded, saveProgress]);

  // Player controls
  const togglePlay = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ type: 'TOGGLE_PLAY' }),
        '*'
      );
    }
  };

  const toggleMute = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ type: 'TOGGLE_MUTE' }),
        '*'
      );
      setIsMuted(!isMuted);
    }
  };

  const skipToNext = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ type: 'SKIP_TO_NEXT' }),
        '*'
      );
    }
  };

  const toggleFullscreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      } else if ((iframeRef.current as any).webkitRequestFullscreen) {
        (iframeRef.current as any).webkitRequestFullscreen();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const embedUrl = buildEmbedUrl();

  if (!embedUrl) {
    return (
      <div className="flex items-center justify-center h-96 bg-base-black rounded-lg">
        <p className="text-base-blue">Invalid player configuration</p>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden group">
      {/* Loading overlay */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-black/80 z-20"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-base-blue border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-white">Loading player...</p>
          </div>
        </motion.div>
      )}

      {/* Error overlay */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/80 z-20"
        >
          <div className="text-center">
            <p className="text-base-blue mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-base-blue text-white rounded-lg hover:bg-base-blue-hover transition-colors"
            >
              Retry
            </button>
          </div>
        </motion.div>
      )}

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 z-10">
        <motion.div
          className="h-full bg-base-blue"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Player iframe */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full h-full min-h-[500px] border-0"
        allowFullScreen
        allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setError('Failed to load player');
          setIsLoading(false);
        }}
      />

      {/* Custom controls overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
      >
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="h-1 bg-gray-600 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-base-blue"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="text-white hover:text-base-blue transition-colors"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>

              <button
                onClick={toggleMute}
                className="text-white hover:text-base-blue transition-colors"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              {type === 'tv' && (
                <button
                  onClick={skipToNext}
                  className="text-white hover:text-base-blue transition-colors"
                  title="Next Episode"
                >
                  <SkipForward size={20} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-base-blue transition-colors"
              >
                <Maximize2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Player;
