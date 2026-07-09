'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List } from 'lucide-react';
import { useAccount } from 'wagmi';
import { getFavorites } from '@/utils/storage';
import MovieCard from '@/components/MovieCard';

export default function MyListPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { address } = useAccount();

  useEffect(() => {
    const list = getFavorites(address);
    setFavorites(list);
    setIsLoading(false);
  }, [address]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-black pt-24 pb-20 font-base">
        <div className="container mx-auto px-6">
          <div className="h-8 w-48 bg-base-gray animate-pulse rounded mb-10" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-base-gray animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-black pt-24 pb-20 font-base">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex items-center gap-4"
        >
          <div className="p-3 bg-base-blue/10 rounded-2xl border border-base-blue/20">
            <List size={32} className="text-base-blue" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white mb-1">My List</h1>
            <p className="text-gray-400">Your personal collection of movies and TV shows.</p>
          </div>
        </motion.div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-16">
            <AnimatePresence>
              {favorites.map((item, index) => (
                <motion.div
                  key={`${item.id}-${item.type}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <MovieCard
                    id={item.id}
                    title={item.title}
                    poster_path={item.poster_path}
                    backdrop_path={item.backdrop_path}
                    vote_average={item.vote_average}
                    release_date={item.release_date}
                    first_air_date={item.first_air_date}
                    media_type={item.type}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6 border border-white/5">
              <List size={40} className="text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Your list is empty</h2>
            <p className="text-gray-400 max-w-md mx-auto mb-8">
              Add movies and TV shows to your list to keep track of what you want to watch next.
            </p>
            <a href="/" className="px-8 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors">
              Browse Content
            </a>
          </motion.div>
        )}
      </div>
    </div>
  );
}
