/**
 * AccessGate.tsx — Route protection wrapper
 *
 * Wraps protected content and redirects to /unlock if the user
 * doesn't have a valid 24-hour streaming pass.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useAccess } from '@/hooks/useAccess';

interface AccessGateProps {
  children: React.ReactNode;
  /** Show a loading skeleton while checking access */
  showSkeleton?: boolean;
}

/**
 * Wrap any page or component with AccessGate to enforce payment gating.
 * Automatically redirects to /unlock if access is invalid or expired.
 */
const AccessGate: React.FC<AccessGateProps> = ({
  children,
  showSkeleton = true,
}) => {
  const { address } = useAccount();
  const { hasAccess, loading } = useAccess(true, address);

  // Loading state — show skeleton
  if (loading) {
    if (!showSkeleton) return null;

    return (
      <div className="min-h-screen bg-base-black flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-14 h-14 border-4 border-[#00F5A0] border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-gray-500 text-sm font-medium">Verifying access...</p>
        </motion.div>
      </div>
    );
  }

  // No access — redirect is already triggered by useAccess
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-base-black flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-12 h-12 border-4 border-[#00F5A0] border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-gray-500 text-sm">Redirecting to unlock...</p>
        </motion.div>
      </div>
    );
  }

  // Access valid — render protected content
  return <>{children}</>;
};

export default AccessGate;
