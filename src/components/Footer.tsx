'use client';

/**
 * Footer.tsx — Minimal Cineby-style site footer
 *
 * Dark near-black bar with:
 *   • RitualStream SVG logo + wordmark (left)
 *   • Disclaimer text
 *   • Contact link
 */

import Logo from './Logo';

const Footer = () => (
  <footer
    className="w-full px-6 py-8 md:py-10 border-t"
    style={{
      background: '#0a0a0a',
      borderColor: 'rgba(255,255,255,0.06)',
      fontFamily: '"DM Sans", system-ui, sans-serif',
    }}
  >
    <div
      className="mx-auto flex flex-col gap-3"
      style={{ maxWidth: '1800px' }}
    >
      {/* Logo + wordmark */}
      <div className="flex items-center gap-2.5">
        <Logo size={26} color="#00F5A0" />
        <span
          className="font-extrabold text-white text-sm tracking-tight"
          style={{ letterSpacing: '-0.01em' }}
        >
          Ritual<span style={{ color: '#00F5A0' }}>Stream</span>
        </span>
      </div>

      {/* Disclaimer */}
      <p
        className="text-sm leading-relaxed"
        style={{ color: 'rgba(255,255,255,0.40)', maxWidth: '72ch' }}
      >
        This site does not store any files on our server. We only link to
        media hosted on 3rd-party services. All content is provided by
        non-affiliated third parties and is publicly available online.
      </p>


    </div>
  </footer>
);

export default Footer;
