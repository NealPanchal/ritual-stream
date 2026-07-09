'use client';

/**
 * src/components/player/ProviderManager.tsx
 *
 * Manages the iframe lifecycle, loading states, and error screens.
 * Key optimizations:
 *  - Stable iframe key (only changes on actual provider switch, not retries)
 *  - Smooth transition overlay during source swap
 *  - React.memo to prevent unnecessary rerenders
 */

import { memo, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { StreamErrorScreen } from '@/components/StreamErrorScreen';
import { CinematicLoading } from '@/components/player/CinematicLoading';
import type { useStreamPlayer } from '@/hooks/useStreamPlayer';

interface ProviderManagerProps {
  stream: ReturnType<typeof useStreamPlayer>;
  playerLoading: boolean;
  backdropUrl: string | null;
  posterUrl: string | null;
  title: string;
  iframeKeyPrefix: string; // e.g. "movie" or "tv-s1-e2"
}

export const ProviderManager = memo(function ProviderManager({
  stream,
  playerLoading,
  backdropUrl,
  posterUrl,
  title,
  iframeKeyPrefix,
}: ProviderManagerProps) {
  // Track last provider to generate stable keys — only changes on actual provider switch
  const lastProviderRef = useRef(stream.currentProvider);
  const sourceVersionRef = useRef(0);

  if (lastProviderRef.current !== stream.currentProvider) {
    lastProviderRef.current = stream.currentProvider;
    sourceVersionRef.current += 1;
  }

  // Handle arrow keys to seek
  const iframeRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!iframeRef.current?.contentWindow) return;
      
      if (e.key === 'ArrowRight') {
        // Try common provider postMessage formats for forward 10s
        iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', command: 'seek', time: 10 }), '*');
        iframeRef.current.contentWindow.postMessage(JSON.stringify({ type: 'SEEK', amount: 10 }), '*');
        iframeRef.current.contentWindow.postMessage({ type: 'SEEK', amount: 10 }, '*');
      } else if (e.key === 'ArrowLeft') {
        // Try common provider postMessage formats for backward 10s
        iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', command: 'seek', time: -10 }), '*');
        iframeRef.current.contentWindow.postMessage(JSON.stringify({ type: 'SEEK', amount: -10 }), '*');
        iframeRef.current.contentWindow.postMessage({ type: 'SEEK', amount: -10 }, '*');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Stable key: only remounts iframe on actual provider change, not retries
  const iframeKey = `${iframeKeyPrefix}-${stream.currentProvider}-${sourceVersionRef.current}`;

  return (
    <>
      {/* Cinematic Loading Screen — shown only during initial load */}
      <AnimatePresence>
        {(playerLoading || stream.isLoading) && !stream.toastMessage && !stream.exhausted && !stream.error && (
          <CinematicLoading backdropUrl={backdropUrl} posterUrl={posterUrl} title={title} />
        )}
      </AnimatePresence>

      {/* Seamless Fallback Toast — minimal, non-intrusive */}
      <AnimatePresence>
        {stream.toastMessage && (
          <motion.div
            initial={{ opacity: 0, x: 20, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 20, y: -20 }}
            className="absolute top-4 right-4 z-[60] px-4 py-2 bg-black/70 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-xl flex items-center gap-3"
          >
            <Loader2 size={14} className="text-[#0052ff] animate-spin" />
            <span className="text-white/80 text-sm font-medium">{stream.toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error screen — ONLY when completely exhausted */}
      {stream.exhausted && stream.error && (
        <StreamErrorScreen
          error={stream.error}
          failureReason={stream.failureReason}
          currentProvider={stream.currentProvider}
          providerHealth={stream.providerHealth}
          retryCountdown={stream.retryCountdown}
          retryCount={stream.retryCount}
          exhausted={stream.exhausted}
          embedUrl={stream.embedUrl}
          onRetry={stream.retry}
          onSwitchProvider={stream.switchProvider}
        />
      )}

      {/* Null URL guard — validation failed */}
      {!stream.embedUrl && !stream.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black" style={{ zIndex: 10 }}>
          <div className="text-center px-6">
            <p className="text-gray-400 text-lg mb-2">Unable to load player</p>
            <p className="text-gray-600 text-sm">Content ID is missing or invalid.</p>
          </div>
        </div>
      )}

      {/* Provider iframe — stable key prevents unnecessary remounts */}
      {stream.embedUrl && (
        <iframe
          ref={iframeRef}
          key={iframeKey}
          src={stream.embedUrl}
          className="w-full h-full border-0"
          style={{ zIndex: 1 }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
          allowFullScreen
          allow="autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          onLoad={stream.handleIframeLoad}
          onError={stream.handleIframeError}
          title={title}
        />
      )}
    </>
  );
});
