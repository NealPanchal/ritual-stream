'use client';

import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { usePlayerIdle } from '@/hooks/usePlayerIdle';

interface PlayerShellProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  renderControls: (isIdle: boolean) => ReactNode;
  topRightContent?: ReactNode;
}

export function PlayerShell({ title, subtitle, onClose, children, renderControls, topRightContent }: PlayerShellProps) {
  const { isIdle } = usePlayerIdle(2000);

  // Handle Escape key to close player
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[200] bg-black flex flex-col ${isIdle ? 'cursor-none' : ''}`}
    >
      {/* Permanent Exit Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        onMouseEnter={() => window.focus()}
        style={{ zIndex: 9999 }}
        className="absolute top-4 left-6 flex items-center justify-center w-10 h-10 flex-shrink-0 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-[#0052ff]/20 hover:border-[#0052ff]/50 transition-all shadow-lg pointer-events-auto"
        aria-label="Exit Player"
        title="Exit Player (Esc)"
      >
        <X size={20} />
      </button>

      {/* Top bar (auto-hides) */}
      <AnimatePresence>
        {!isIdle && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            onMouseEnter={() => window.focus()}
            style={{ zIndex: 50 }}
            className="absolute top-0 left-0 w-full flex items-center justify-between pr-6 pl-20 py-4 bg-gradient-to-b from-black/80 to-transparent flex-shrink-0 pointer-events-none"
          >
            <div className="flex flex-col items-start leading-tight min-w-0 pointer-events-auto">
              <span className="font-medium text-gray-200 truncate max-w-[240px] sm:max-w-none">{title}</span>
              {subtitle && <span className="text-sm text-gray-400">{subtitle}</span>}
            </div>
            {topRightContent && (
              <div className="flex items-center gap-4 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                {topRightContent}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden" style={{ zIndex: 0 }}>
        {children}

        {/* Controls Overlay */}
        <AnimatePresence>
          <div 
            className="pointer-events-auto absolute bottom-0 left-0 w-full z-50"
            onMouseEnter={() => window.focus()}
            onClick={() => window.focus()}
          >
            {renderControls(isIdle)}
          </div>
        </AnimatePresence>

        {/* RitualStream Watermark (Covers Provider Watermark permanently) */}
        <div className="absolute top-4 right-6 z-[60] pointer-events-none flex items-center justify-center rounded-sm bg-black/20 backdrop-blur-md px-3 py-1.5 shadow-2xl">
          <span className="text-white/70 font-black tracking-[0.2em] text-[13px] select-none drop-shadow-md">
            RitualStream
          </span>
        </div>


      </div>
    </motion.div>
  );
}
