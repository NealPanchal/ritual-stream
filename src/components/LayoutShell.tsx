/**
 * LayoutShell.tsx — Conditional layout wrapper
 *
 * Shows the global Header + Footer on content pages but hides both on
 * /unlock and /watch routes which have their own navigation.
 */

'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

/** Routes that render their own navigation and footer */
const STANDALONE_ROUTES = ['/unlock', '/watch', '/live/'];


interface LayoutShellProps {
  children: React.ReactNode;
}

const LayoutShell: React.FC<LayoutShellProps> = ({ children }) => {
  const pathname = usePathname();
  const isStandalone = STANDALONE_ROUTES.some((route) => pathname?.startsWith(route));

  return (
    <>
      {!isStandalone && <Header />}
      <main className="flex-1">{children}</main>
      {!isStandalone && <Footer />}
    </>
  );
};

export default LayoutShell;
