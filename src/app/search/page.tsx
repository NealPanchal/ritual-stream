'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, X, Clock, Film, Tv, Play, Info } from 'lucide-react';
import { useSearch } from '@/lib/tmdb';
import MovieCard from '@/components/MovieCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import { getSearchHistory, addToSearchHistory } from '@/utils/storage';
import { SearchResult } from '@/types';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const { data: searchResults, isLoading, error } = useSearch(debouncedQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (query.trim()) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('q', query.trim());
        window.history.replaceState({}, '', newUrl.toString());
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      addToSearchHistory(query.trim());
      setSearchHistory(getSearchHistory());
    }
  };

  const filteredResults = useMemo(() => {
    return searchResults?.results?.filter((item: SearchResult) => item.media_type !== 'person') || [];
  }, [searchResults]);

  return (
    <div className="min-h-screen bg-base-black pt-24 pb-20 font-base">
      <div className="container mx-auto px-6">
        {/* Search Input Section */}
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-3xl mx-auto"
          >
            <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Titles, people, genres..."
              className="w-full bg-gray-900/80 border border-white/10 text-white pl-16 pr-14 py-5 rounded-2xl text-xl focus:outline-none focus:ring-4 focus:ring-base-blue/30 focus:border-base-blue/50 transition-all placeholder-gray-500 backdrop-blur-md"
              autoFocus
            />
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setQuery('')}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Search State Display */}
        {!query && searchHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-3xl mx-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-400 uppercase tracking-widest text-sm text-white">Recent Searches</h2>
              <button
                onClick={() => { localStorage.removeItem('ritualstream_search_history'); setSearchHistory([]); }}
                className="text-gray-500 hover:text-white transition-colors text-sm font-bold"
              >
                CLEAR ALL
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {searchHistory.map((h, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(h)}
                  className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-all border border-white/5 font-medium"
                >
                  {h}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Results Grid */}
        <div className="mt-12">
          {isLoading && query ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-16">
               {Array.from({ length: 12 }).map((_, i) => (
                 <div key={i} className="aspect-[2/3] bg-base-gray animate-pulse rounded-lg" />
               ))}
            </div>
          ) : filteredResults.length > 0 ? (
            <div>
              <h2 className="text-2xl font-black text-white mb-8 px-1">Top Results</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-16">
                <AnimatePresence>
                  {filteredResults.map((item: any, index: number) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <MovieCard
                        id={item.id}
                        title={item.title || item.name}
                        poster_path={item.poster_path}
                        backdrop_path={item.backdrop_path}
                        vote_average={item.vote_average}
                        release_date={item.release_date}
                        first_air_date={item.first_air_date}
                        media_type={item.media_type}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ) : query && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
               <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-6 border border-white/10">
                  <SearchIcon size={32} className="text-gray-600" />
               </div>
               <h3 className="text-2xl font-bold text-white mb-2">No matches for "{query}"</h3>
               <p className="text-gray-400 max-w-sm">Try using different keywords or search for a specific movie or TV show title.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-base-black pt-24 pb-20 font-base flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-14 h-14 border-4 border-base-blue border-t-transparent rounded-full"
        />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
