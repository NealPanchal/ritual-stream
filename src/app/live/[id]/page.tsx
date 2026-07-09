'use client';

/**
 * /live/[id] — Live Player Page
 *
 * Cinematic fullscreen live player with:
 *  - Iframe embed (public stream URL)
 *  - Top bar: back + event title + LIVE badge + viewer count
 *  - RitualStream glass badge (non-blocking, pointer-events none)
 *  - Animated mock live chat sidebar (desktop) / bottom sheet (mobile)
 *  - Auto-scrolling mock messages
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Radio, Wifi, MessageCircle, Send, X } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { getEventById } from '@/lib/live-data';

// ─── Mock live chat data ──────────────────────────────────────────────────────
const MOCK_USERS = ['CryptoFan99', 'SportsNerd', 'NFLKing', 'BaseUser42', 'Web3Viewer',
                    'GoalMachine', 'TrueBlue88', 'StreamKing', 'CricketLover', 'GG_EZ'];
const MOCK_MESSAGES_POOL = [
  'GOAALLLL!!!!! 🔥🔥🔥', 'What a save!', 'This game is insane', 'LFG!!!',
  'Best match of the season 🏆', 'Unbelievable play', 'That was offside!',
  "Can't believe that just happened", '🐐🐐🐐', 'Stream is so smooth, love RitualStream!',
  "Let's GO!", 'W player', 'This team is on fire 🔥', 'Classic match right here',
  'First time watching here, quality is 🔥', "He's absolutely cooking",
  'lol that tackle', 'GG', 'No way that was a foul', '❤️‍🔥',
];

function randomUser() { return MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)]; }
function randomMsg()  { return MOCK_MESSAGES_POOL[Math.floor(Math.random() * MOCK_MESSAGES_POOL.length)]; }

interface ChatMsg { id: number; user: string; text: string; color: string; }
const USER_COLORS = ['#60a5fa','#34d399','#f472b6','#fb923c','#a78bfa','#22d3ee','#facc15'];
function randomColor() { return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]; }

// Seed initial messages
const INITIAL_MSGS: ChatMsg[] = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  user:  randomUser(),
  text:  randomMsg(),
  color: randomColor(),
}));

// ─── Stream uptime counter ────────────────────────────────────────────────────
function useUptime() {
  const [seconds, setSeconds] = useState(Math.floor(Math.random() * 7200) + 600);
  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${m}:${String(s).padStart(2,'0')}`;
}

// ─── Live Chat panel ──────────────────────────────────────────────────────────
function LiveChat({ onClose }: { onClose?: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>(INITIAL_MSGS);
  const [input,    setInput]    = useState('');
  const bottomRef               = useRef<HTMLDivElement>(null);
  let   nextId                  = useRef(INITIAL_MSGS.length);

  // Auto-add messages every 2-4s
  useEffect(() => {
    const tick = () => {
      setMessages(prev => {
        const updated = [...prev, { id: nextId.current++, user: randomUser(), text: randomMsg(), color: randomColor() }];
        return updated.slice(-60); // keep last 60
      });
    };
    const interval = setInterval(tick, Math.random() * 2000 + 1800);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { id: nextId.current++, user: 'You', text: input.trim(), color: '#0052FF' }]);
    setInput('');
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background:    'rgba(10,10,10,0.92)',
        borderLeft:    '1px solid rgba(255,255,255,0.07)',
        fontFamily:    '"DM Sans", system-ui, sans-serif',
      }}
    >
      {/* Chat header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2">
          <MessageCircle size={14} style={{ color: '#dc2626' }} />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Live Chat</span>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2" style={{ scrollbarWidth: 'none' }}>
        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex gap-1.5 text-xs leading-snug"
          >
            <span className="font-bold flex-shrink-0" style={{ color: msg.color }}>{msg.user}</span>
            <span style={{ color: 'rgba(255,255,255,0.70)' }}>{msg.text}</span>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <input
          type="text"
          placeholder="Say something..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          className="flex-1 text-xs text-white rounded-lg px-3 py-2 outline-none"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}
        />
        <button
          onClick={send}
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: '#dc2626' }}
        >
          <Send size={13} color="white" />
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LivePlayerPage() {
  const router       = useRouter();
  const params       = useParams<{ id: string }>();
  const event        = getEventById(params.id);
  const uptime       = useUptime();
  const [chatOpen, setChatOpen] = useState(false);
  const [viewers]   = useState(() => Math.floor(Math.random() * 200000) + 20000);

  // Fake viewer fluctuation
  const [liveViewers, setLiveViewers] = useState(viewers);
  useEffect(() => {
    const t = setInterval(() => {
      setLiveViewers(v => v + Math.floor(Math.random() * 60) - 28);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const formatViewers = (n: number) =>
    n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` :
    n >= 1000    ? `${(n / 1000).toFixed(1)}k` : `${n}`;

  // Fallback for unknown IDs — use a generic embed
  const title     = event?.title    ?? 'Live Stream';
  const sport     = event?.sport    ?? 'sports';
  const embedUrl  = event?.embedUrl ?? '';

  return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 200 }}>

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 md:px-6 py-3 flex-shrink-0"
        style={{
          background:    'rgba(0,0,0,0.85)',
          backdropFilter:'blur(12px)',
          borderBottom:  '1px solid rgba(255,255,255,0.07)',
          zIndex:        10,
          fontFamily:    '"DM Sans", system-ui, sans-serif',
        }}
      >
        {/* Left: back + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <ArrowLeft size={18} />
            <span className="text-sm hidden sm:block">Back</span>
          </button>
          <div
            className="hidden sm:block w-px h-4 flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          />
          <div className="min-w-0">
            <h1 className="font-bold text-white text-sm truncate">{title}</h1>
            <p className="text-[11px] capitalize" style={{ color: 'rgba(255,255,255,0.40)' }}>
              {sport}
            </p>
          </div>
        </div>

        {/* Right: LIVE badge + uptime + viewers + chat toggle */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* LIVE */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-black uppercase tracking-widest"
            style={{ background: 'rgba(220,38,38,0.85)', color: '#fff', fontFamily: '"Space Mono", monospace' }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
            </span>
            LIVE
          </div>

          {/* Uptime */}
          <span
            className="text-[11px] tabular-nums hidden sm:block"
            style={{ color: 'rgba(255,255,255,0.40)', fontFamily: '"Space Mono", monospace' }}
          >
            {uptime}
          </span>

          {/* Viewers */}
          <div className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            <Wifi size={11} />
            <span style={{ fontFamily: '"Space Mono", monospace' }}>{formatViewers(liveViewers)}</span>
          </div>

          {/* Chat toggle (mobile) */}
          <button
            onClick={() => setChatOpen(o => !o)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{
              background: chatOpen ? 'rgba(220,38,38,0.80)' : 'rgba(255,255,255,0.08)',
              color: '#fff',
            }}
          >
            <MessageCircle size={13} />
            Chat
          </button>
        </div>
      </div>

      {/* ── Main area: player + chat ──────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Player */}
        <div className="flex-1 relative overflow-hidden" style={{ zIndex: 0 }}>
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full border-0"
              style={{ zIndex: 1 }}
              allowFullScreen
              allow="autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              title={title}
            />
          ) : (
            /* Placeholder when no embed URL */
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-4"
              style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 100%)' }}
            >
              <Radio size={48} style={{ color: '#dc2626', opacity: 0.7 }} />
              <div className="text-center">
                <p className="font-bold text-white text-lg mb-1">{title}</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.40)' }}>
                  Stream starting soon — stay tuned
                </p>
              </div>
              {/* Pulsing ring for atmosphere */}
              <div className="relative">
                <div
                  className="w-3 h-3 rounded-full animate-ping"
                  style={{ background: '#dc2626', opacity: 0.6 }}
                />
              </div>
            </div>
          )}

          {/* Glass brand badge — top right, pointer-events none */}
          <div
            aria-hidden="true"
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
            style={{
              zIndex:         2,
              pointerEvents:  'none',
              background:     'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(8px)',
              border:         '1px solid rgba(255,255,255,0.08)',
              opacity:        0.70,
              fontFamily:     '"DM Sans", sans-serif',
            }}
          >
            <div className="w-3.5 h-3.5 rounded-sm bg-[#0052FF] flex items-center justify-center flex-shrink-0">
              <span className="text-[7px] font-black text-white leading-none">B</span>
            </div>
            <span className="text-[10px] font-semibold text-white/80 tracking-wide leading-none">RitualStream</span>
          </div>
        </div>

        {/* Live Chat — desktop sidebar */}
        <div
          className="hidden lg:flex flex-col flex-shrink-0"
          style={{ width: '300px' }}
        >
          <LiveChat />
        </div>
      </div>

      {/* Mobile chat bottom sheet */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            className="lg:hidden fixed inset-x-0 bottom-0 flex flex-col rounded-t-2xl overflow-hidden"
            style={{ height: '50vh', zIndex: 300, background: 'rgba(10,10,10,0.97)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          >
            <LiveChat onClose={() => setChatOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
