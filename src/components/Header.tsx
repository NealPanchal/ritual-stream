'use client';

/**
 * Header.tsx — Premium RitualStream Navigation Bar
 *
 * Cineby-quality streaming navbar with:
 * - Glassmorphism backdrop blur
 * - Animated active nav links with layoutId underline
 * - Expandable search input
 * - Wallet-aware profile dropdown with glassmorphism
 * - Scroll-reactive opacity / blur
 * - Responsive hamburger drawer
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  X,
  Menu,
  Copy,
  Check,
  Settings,
  LogOut,
  ChevronDown,
  Wallet,
  Film,
  Tv2,
  Home,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal, useAccountModal, useChainModal } from '@rainbow-me/rainbowkit';
import { cn } from '@/utils';
import { getUserProfile } from '@/utils/storage';
import Logo from './Logo';

// ─── Types ──────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { label: 'Home',       href: '/',           icon: Home  },
  { label: 'Movies',     href: '/movies',     icon: Film  },
  { label: 'TV Shows',   href: '/tv',         icon: Tv2   },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Truncate a 0x address to "0x1234…abcd" */
function shortAddress(addr?: string) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Animated copy-to-clipboard button */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
      title="Copy address"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            className="flex items-center gap-1 text-emerald-400"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
          >
            <Check size={12} strokeWidth={2.5} /> Copied
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            className="flex items-center gap-1"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
          >
            <Copy size={12} strokeWidth={2} /> Copy
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Header = () => {
  // ── State
  const [isScrolled,       setIsScrolled]       = useState(false);
  const [isSearchOpen,     setIsSearchOpen]      = useState(false);
  const [searchQuery,      setSearchQuery]       = useState('');
  const [isProfileOpen,    setIsProfileOpen]     = useState(false);
  const [isMobileOpen,     setIsMobileOpen]      = useState(false);
  const [hasNotification,  setHasNotification]   = useState(true);

  // ── Refs
  const searchRef   = useRef<HTMLInputElement>(null);
  const profileRef  = useRef<HTMLDivElement>(null);

  // ── Routing & wallet
  const router    = useRouter();
  const pathname  = usePathname();
  const { address, isConnected } = useAccount();
  const { disconnect }           = useDisconnect();
  const { openConnectModal }     = useConnectModal();
  const { openChainModal }       = useChainModal();

  const profile = isConnected && address ? getUserProfile(address) : null;
  const avatarSeed = address ?? 'default';
  const avatarUrl  = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${avatarSeed}`;

  // ── Effects

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-focus search input
  useEffect(() => {
    if (isSearchOpen) searchRef.current?.focus();
  }, [isSearchOpen]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  // ── Handlers
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  }, [searchQuery, router]);

  const closeSearch = () => { setIsSearchOpen(false); setSearchQuery(''); };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════
          MAIN NAVBAR
      ════════════════════════════════════════════════════════════════ */}
      <motion.header
        className={cn(
          'fixed top-0 left-0 right-0 z-[100]',
          'transition-all duration-500 ease-out',
          isScrolled
            ? 'bg-black/85 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_1px_40px_rgba(0,0,0,0.6)]'
            : 'bg-gradient-to-b from-black/70 via-black/30 to-transparent backdrop-blur-[2px]'
        )}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 md:px-10 xl:px-14">
          <div className="flex items-center justify-between h-[68px]">

            {/* ─── LEFT: Logo + Nav ─────────────────────────────────── */}
            <div className="flex items-center gap-8 xl:gap-10">

              {/* Logo */}
              <Link
                href="/"
                className="flex items-center gap-3 group flex-shrink-0"
                aria-label="RitualStream home"
              >
                <motion.div
                  whileHover={{ scale: 1.08, rotate: -3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                  className="relative"
                >
                  {/* glow ring */}
                  <div className="absolute inset-0 rounded-xl bg-ritual-green/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-110" />
                  <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-[#00F5A0]/10 border border-[#00F5A0]/30 shadow-lg shadow-[#00F5A0]/20">
                    <Logo size={22} color="#00F5A0" />
                  </div>
                </motion.div>

                <div className="hidden sm:flex flex-col leading-none">
                  <span className="text-white font-extrabold text-[17px] tracking-[-0.03em] group-hover:text-[#00F5A0] transition-colors duration-200">
                    Ritual<span className="text-[#00F5A0] group-hover:text-white transition-colors duration-200">Stream</span>
                  </span>
                  <span className="text-[9px] text-gray-500 font-medium tracking-[0.15em] uppercase mt-[1px]">
                    Ritual Network
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href ||
                    (item.href !== '/' && pathname?.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'relative px-3.5 py-2 rounded-lg text-[13.5px] font-medium',
                        'transition-colors duration-200 group flex items-center gap-2',
                        isActive
                          ? 'text-white'
                          : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                      )}
                    >
                      {/* Active pill bg */}
                      {isActive && (
                        <motion.span
                          layoutId="navPill"
                          className="absolute inset-0 bg-white/[0.07] rounded-lg"
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5">
                        {item.label}
                        {/* Pulsing red dot for Live link */}
                        {item.href === '/live' && (
                          <span className="relative flex h-1.5 w-1.5 mb-0.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-80" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                          </span>
                        )}
                      </span>
                      {/* Active underline */}
                      {isActive && (
                        <motion.span
                          layoutId="navUnderline"
                          className="absolute bottom-0.5 left-3.5 right-3.5 h-[2px] bg-base-blue rounded-full"
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* ─── RIGHT: Actions ───────────────────────────────────── */}
            <div className="flex items-center gap-1 sm:gap-2">

              {/* Expandable Search */}
              <form onSubmit={handleSearch} className="flex items-center relative">
                <motion.div
                  animate={{ width: isSearchOpen ? 260 : 40 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className={cn(
                    'flex items-center overflow-hidden rounded-full h-9',
                    isSearchOpen
                      ? 'bg-white/[0.07] border border-white/20 ring-1 ring-base-blue/40 pr-3'
                      : 'bg-transparent border border-transparent'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen((o) => !o)}
                    className="w-9 h-9 flex items-center justify-center flex-shrink-0 text-gray-300 hover:text-white transition-colors"
                    aria-label="Search"
                  >
                    <Search size={18} strokeWidth={2} />
                  </button>
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search movies, series, anime…"
                    className={cn(
                      'bg-transparent text-white text-[13px] outline-none flex-1 min-w-0',
                      'placeholder:text-gray-500 transition-opacity duration-200',
                      isSearchOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    )}
                  />
                  <AnimatePresence>
                    {isSearchOpen && searchQuery && (
                      <motion.button
                        type="button"
                        onClick={closeSearch}
                        className="text-gray-500 hover:text-white transition-colors flex-shrink-0 ml-1"
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                      >
                        <X size={14} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              </form>

              {/* Notifications */}
              <button
                className="hidden sm:flex relative w-9 h-9 items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.06] rounded-full transition-all duration-200"
                aria-label="Notifications"
              >
                <Bell size={18} strokeWidth={2} />
                {hasNotification && (
                  <motion.span
                    className="absolute top-1.5 right-1.5 w-[7px] h-[7px] bg-[#00F5A0] rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </button>

              {/* Divider */}
              <div className="hidden md:block w-px h-5 bg-white/10 mx-1" />

              {/* Wallet / Profile */}
              {isConnected && address ? (
                /* ── Connected: Profile dropdown trigger ── */
                <div className="relative" ref={profileRef}>
                  <motion.button
                    onClick={() => setIsProfileOpen((o) => !o)}
                    className={cn(
                      'flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full',
                      'border transition-all duration-200',
                      isProfileOpen
                        ? 'bg-white/[0.09] border-white/20'
                        : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.07] hover:border-white/15'
                    )}
                    whileTap={{ scale: 0.97 }}
                    aria-label="Profile menu"
                    aria-expanded={isProfileOpen}
                  >
                    {/* Avatar */}
                    <div className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-base-blue/50 flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatarUrl}
                        alt="avatar"
                        className="w-full h-full object-cover bg-base-gray-light"
                      />
                    </div>
                    <span className="hidden md:block text-[13px] font-medium text-gray-200">
                      {shortAddress(address)}
                    </span>
                    <motion.div
                      animate={{ rotate: isProfileOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={14} className="text-gray-500" />
                    </motion.div>
                  </motion.button>

                  {/* ── Profile Dropdown ── */}
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        className="absolute top-[calc(100%+10px)] right-0 w-[280px] z-50 overflow-hidden"
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                      >
                        {/* Glass card */}
                        <div className="rounded-2xl bg-[#0c0c10]/95 backdrop-blur-3xl border border-white/[0.09] shadow-[0_8px_60px_rgba(0,0,0,0.7)]">

                          {/* Header: avatar + address */}
                          <div className="p-4 border-b border-white/[0.06]">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-11 h-11 rounded-2xl overflow-hidden ring-2 ring-base-blue/40 flex-shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-white font-semibold text-sm truncate">
                                  {profile?.username ?? 'Ritual User'}
                                </p>
                                <p className="text-gray-500 text-xs font-mono truncate mt-0.5">
                                  {shortAddress(address)}
                                </p>
                              </div>
                            </div>

                            {/* Address + copy */}
                            <div className="flex items-center justify-between bg-white/[0.04] rounded-xl px-3 py-2.5 border border-white/[0.06]">
                              <span className="text-[11px] text-gray-500 font-mono truncate mr-2">
                                {address}
                              </span>
                              <CopyButton text={address} />
                            </div>
                          </div>

                          {/* Network status */}
                          <div className="px-4 py-3 border-b border-white/[0.06]">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[#00F5A0]/10 border border-[#00F5A0]/30 flex items-center justify-center">
                                  <span className="text-[10px] font-black text-[#00F5A0] leading-none">R</span>
                                </div>
                                <span className="text-[13px] text-gray-300 font-medium">Ritual Network</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <motion.span
                                  className="w-2 h-2 rounded-full bg-emerald-400"
                                  animate={{ scale: [1, 1.4, 1] }}
                                  transition={{ duration: 1.8, repeat: Infinity }}
                                />
                                <span className="text-[11px] text-emerald-400 font-medium">Connected</span>
                              </div>
                            </div>
                          </div>

                          {/* Menu items */}
                          <div className="p-2">
                            {[
                              { icon: Wallet,   label: 'Wallet',    action: () => { openChainModal?.(); setIsProfileOpen(false); } },
                              { icon: Settings, label: 'Settings',  href: '/profile' },
                            ].map((item) => (
                              item.href ? (
                                <Link
                                  key={item.label}
                                  href={item.href}
                                  onClick={() => setIsProfileOpen(false)}
                                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-gray-300 hover:text-white hover:bg-white/[0.06] transition-all duration-150 group"
                                >
                                  <item.icon size={15} className="text-gray-500 group-hover:text-base-blue transition-colors" />
                                  {item.label}
                                </Link>
                              ) : (
                                <button
                                  key={item.label}
                                  onClick={item.action}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-gray-300 hover:text-white hover:bg-white/[0.06] transition-all duration-150 group"
                                >
                                  <item.icon size={15} className="text-gray-500 group-hover:text-base-blue transition-colors" />
                                  {item.label}
                                </button>
                              )
                            ))}
                          </div>

                          {/* Disconnect */}
                          <div className="p-2 pt-0">
                            <button
                              onClick={() => { disconnect(); setIsProfileOpen(false); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] transition-all duration-150 group"
                            >
                              <LogOut size={15} className="group-hover:translate-x-0.5 transition-transform" />
                              Disconnect Wallet
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* ── Disconnected: Connect button ── */
                <motion.button
                  onClick={openConnectModal}
                  className="flex items-center gap-2 h-9 px-4 rounded-full bg-[#00F5A0] hover:bg-[#00c87f] text-black text-[13px] font-semibold shadow-lg shadow-[#00F5A0]/20 hover:shadow-[#00F5A0]/40 transition-all duration-200"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Wallet size={15} strokeWidth={2} />
                  <span className="hidden sm:block">Connect</span>
                </motion.button>
              )}

              {/* Mobile hamburger */}
              <button
                className="md:hidden flex items-center justify-center w-9 h-9 text-gray-300 hover:text-white hover:bg-white/[0.06] rounded-full transition-all duration-200 ml-1"
                onClick={() => setIsMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ════════════════════════════════════════════════════════════════
          MOBILE DRAWER
      ════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsMobileOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              className="fixed top-0 right-0 bottom-0 w-[300px] z-[120] flex flex-col bg-[#080810]/95 backdrop-blur-3xl border-l border-white/[0.07] shadow-[−30px_0_80px_rgba(0,0,0,0.8)]"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 250 }}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#00F5A0]/10 border border-[#00F5A0]/30 shadow-lg">
                    <Logo size={16} color="#00F5A0" />
                  </div>
                  <span className="font-extrabold text-white text-base tracking-tight">
                    Ritual<span className="text-[#00F5A0]">Stream</span>
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/[0.06] rounded-full transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation links */}
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {NAV_ITEMS.map((item, i) => {
                  const isActive = pathname === item.href ||
                    (item.href !== '/' && pathname?.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + i * 0.04 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium text-[15px]',
                          isActive
                            ? 'bg-base-blue/10 text-white border border-base-blue/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                        )}
                      >
                        <Icon
                          size={17}
                          className={cn(isActive ? 'text-base-blue' : 'text-gray-600')}
                        />
                        {item.label}
                        {isActive && (
                          <motion.div
                            layoutId="mobileActiveDot"
                            className="ml-auto w-1.5 h-1.5 rounded-full bg-base-blue"
                          />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Wallet section */}
              <div className="px-4 py-5 border-t border-white/[0.06]">
                {isConnected && address ? (
                  <div className="space-y-3">
                    {/* Avatar + address */}
                    <div className="flex items-center gap-3 px-3 py-3 bg-white/[0.04] rounded-xl border border-white/[0.06]">
                      <div className="w-9 h-9 rounded-xl overflow-hidden ring-2 ring-base-blue/40 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">
                          {profile?.username ?? 'Ritual User'}
                        </p>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-gray-500 text-xs font-mono truncate">
                            {shortAddress(address)}
                          </p>
                          <CopyButton text={address} />
                        </div>
                      </div>
                    </div>

                    {/* Network badge */}
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#00F5A0]/10 border border-[#00F5A0]/30 flex items-center justify-center">
                          <span className="text-[9px] font-black text-[#00F5A0]">R</span>
                        </div>
                        <span className="text-gray-400 text-xs">Ritual Network</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        <span className="text-emerald-400 text-xs">Live</span>
                      </div>
                    </div>

                    {/* Disconnect */}
                    <button
                      onClick={() => { disconnect(); setIsMobileOpen(false); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/10 text-sm font-medium transition-all"
                    >
                      <LogOut size={15} />
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { openConnectModal?.(); setIsMobileOpen(false); }}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-[#00F5A0] hover:bg-[#00c87f] text-black font-semibold rounded-xl shadow-lg shadow-[#00F5A0]/20 transition-all duration-200 text-[14px]"
                  >
                    <Wallet size={16} />
                    Connect Wallet
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
