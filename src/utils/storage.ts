// Storage utility for managing watch history and progress
import { MovieCardProps } from '@/types';

const STORAGE_KEYS = {
  WATCH_HISTORY: 'ritualstream_watch_history',
  WATCH_PROGRESS: 'ritualstream_watch_progress',
  FAVORITES: 'ritualstream_favorites',
  USER_PROFILE: 'ritualstream_user_profile',
  USER_PREFERENCES: 'ritualstream_user_preferences',
  SEARCH_HISTORY: 'ritualstream_search_history',
};

/**
 * Helper to get a wallet-specific storage key
 */
const getWalletKey = (key: string, address?: string) => {
  if (!address) return key;
  return `${key}_${address.toLowerCase()}`;
};

/**
 * Get watch history from localStorage
 * @returns {Array} Array of watched items
 */
export const getWatchHistory = (address?: string) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') return [];
  
  try {
    const key = getWalletKey(STORAGE_KEYS.WATCH_HISTORY, address);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting watch history:', error);
    return [];
  }
};

/**
 * Add item to watch history
 * @param {Object} item - Item to add
 * @param {number} item.id - Item ID
 * @param {string} item.title - Item title
 * @param {string} item.type - 'movie' or 'tv'
 * @param {string} item.poster_path - Poster image path
 * @param {number} item.timestamp - Current timestamp
 */
export const addToWatchHistory = (item: MovieCardProps, address?: string) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined' || typeof localStorage.setItem !== 'function') return [];
  
  try {
    const history = getWatchHistory(address);
    const existingIndex = history.findIndex((h: MovieCardProps) => h.id === item.id && h.media_type === item.media_type);
    
    const watchItem = {
      ...item,
      timestamp: Date.now(),
    };

    if (existingIndex > -1) {
      history[existingIndex] = watchItem;
    } else {
      history.unshift(watchItem);
    }

    // Keep only last 50 items
    const trimmedHistory = history.slice(0, 50);
    const key = getWalletKey(STORAGE_KEYS.WATCH_HISTORY, address);
    localStorage.setItem(key, JSON.stringify(trimmedHistory));
    
    return trimmedHistory;
  } catch (error) {
    console.error('Error adding to watch history:', error);
    return [];
  }
};

/**
 * Get watch progress for an item
 * @param {number} id - Item ID
 * @param {string} type - 'movie' or 'tv'
 * @param {number} season - Season number (for TV)
 * @param {number} episode - Episode number (for TV)
 * @returns {Object|null} Progress data or null
 */
export const getWatchProgress = (id: number, type: string, season?: number, episode?: number, address?: string) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') return null;
  
  try {
    const key = getWalletKey(STORAGE_KEYS.WATCH_PROGRESS, address);
    const data = localStorage.getItem(key);
    const progress = data ? JSON.parse(data) : {};
    
    const itemKey = type === 'movie' ? `movie_${id}` : `tv_${id}_s${season}_e${episode}`;
    return progress[itemKey] || null;
  } catch (error) {
    console.error('Error getting watch progress:', error);
    return null;
  }
};

/**
 * Save watch progress
 */
export const saveWatchProgress = (id: number, type: string, currentTime: number, duration: number, season?: number, episode?: number, address?: string) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined' || typeof localStorage.setItem !== 'function') return null;
  
  try {
    const key = getWalletKey(STORAGE_KEYS.WATCH_PROGRESS, address);
    const data = localStorage.getItem(key);
    const progress = data ? JSON.parse(data) : {};
    
    const itemKey = type === 'movie' ? `movie_${id}` : `tv_${id}_s${season}_e${episode}`;
    const percentage = (currentTime / duration) * 100;
    
    progress[itemKey] = {
      id,
      type,
      currentTime,
      duration,
      percentage: Math.min(percentage, 99), // Cap at 99% to mark as completed
      season,
      episode,
      lastUpdated: Date.now()
    };

    localStorage.setItem(key, JSON.stringify(progress));
    return progress[itemKey];
  } catch (error) {
    console.error('Error saving watch progress:', error);
    return null;
  }
};

/**
 * Get continue watching items
 */
export const getContinueWatching = (address?: string, limit = 10) => {
  if (typeof window === 'undefined') return [];
  
  try {
    const history = getWatchHistory(address);
    const key = getWalletKey(STORAGE_KEYS.WATCH_PROGRESS, address);
    const data = localStorage.getItem(key);
    const progress = data ? JSON.parse(data) : {};
    
    const itemsWithProgress = history.map((item: any) => {
      const itemKey = item.media_type === 'movie' 
        ? `movie_${item.id}` 
        : `tv_${item.id}_s${item.season}_e${item.episode}`;
      
      const progressData = progress[itemKey];
      
      if (progressData && progressData.percentage > 5 && progressData.percentage < 95) {
        return {
          ...item,
          progress: progressData
        };
      }
      
      return null;
    }).filter(Boolean);

    // Sort by last updated time
    itemsWithProgress.sort((a: any, b: any) => b.progress.lastUpdated - a.progress.lastUpdated);
    
    return itemsWithProgress.slice(0, limit);
  } catch (error) {
    console.error('Error getting continue watching:', error);
    return [];
  }
};

/**
 * Get user profile
 */
export const getUserProfile = (address: string) => {
  if (typeof window === 'undefined' || !address) return null;
  const key = getWalletKey(STORAGE_KEYS.USER_PROFILE, address);
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : {
    address,
    username: 'Siggy',
    avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' + address,
    joinedAt: Date.now()
  };
};

/**
 * Save user profile
 */
export const saveUserProfile = (address: string, profile: any) => {
  if (typeof window === 'undefined' || !address) return null;
  const key = getWalletKey(STORAGE_KEYS.USER_PROFILE, address);
  localStorage.setItem(key, JSON.stringify(profile));
  return profile;
};

/**
 * Clear watch history
 */
export const clearWatchHistory = () => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEYS.WATCH_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.WATCH_PROGRESS);
  } catch (error) {
    console.error('Error clearing watch history:', error);
  }
};

/**
 * Get user preferences
 * @returns {Object} User preferences
 */
export const getUserPreferences = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') return {
    autoplay: true,
    quality: 'auto' as const,
    subtitles: false
  };
  
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return data ? JSON.parse(data) : {
      autoplay: true,
      quality: 'auto',
      subtitles: false
    };
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return {
      autoplay: true,
      quality: 'auto',
      subtitles: false
    };
  }
};

/**
 * Save user preferences
 * @param {Object} preferences - User preferences
 */
export const saveUserPreferences = (preferences: any) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined' || typeof localStorage.setItem !== 'function') return null;
  
  try {
    const currentPrefs = getUserPreferences();
    const updatedPrefs = { ...currentPrefs, ...preferences };
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updatedPrefs));
    return updatedPrefs;
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return null;
  }
};

/**
 * Get search history
 * @returns {Array} Array of search queries
 */
export const getSearchHistory = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting search history:', error);
    return [];
  }
};

/**
 * Add query to search history
 * @param {string} query - Search query
 */
export const addToSearchHistory = (query: string) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined' || typeof localStorage.setItem !== 'function') return;
  
  try {
    const history = getSearchHistory();
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) return;
    
    // Remove existing and add to beginning
    const filteredHistory = history.filter((h: string) => h !== trimmedQuery);
    filteredHistory.unshift(trimmedQuery);
    
    // Keep only last 20 searches
    const limitedHistory = filteredHistory.slice(0, 20);
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error('Error adding to search history:', error);
  }
};

/**
 * Clear search history
 */
export const clearSearchHistory = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined' || typeof localStorage.removeItem !== 'function') return;
  
  try {
    localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
};

/**
 * Get favorites from localStorage
 * @returns {Array} Array of favorite items
 */
export const getFavorites = (address?: string) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') return [];
  try {
    const key = getWalletKey(STORAGE_KEYS.FAVORITES, address);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

/**
 * Toggle item in favorites
 * @param {Object} item - Item to toggle
 */
export const toggleFavorite = (item: MovieCardProps, address?: string) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined' || typeof localStorage.setItem !== 'function') return [];
  try {
    const favorites = getFavorites(address);
    const existingIndex = favorites.findIndex((f: MovieCardProps) => f.id === item.id && f.media_type === item.media_type);
    
    if (existingIndex > -1) {
      favorites.splice(existingIndex, 1);
    } else {
      favorites.unshift({
        id: item.id,
        title: item.title,
        media_type: item.media_type,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        vote_average: item.vote_average,
        release_date: item.release_date,
        first_air_date: item.first_air_date,
        addedAt: Date.now()
      });
    }

    const key = getWalletKey(STORAGE_KEYS.FAVORITES, address);
    localStorage.setItem(key, JSON.stringify(favorites));
    return favorites;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return [];
  }
};

/**
 * Check if item is in favorites
 */
export const isFavorite = (id: number, type: string, address?: string) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') return false;
  const favorites = getFavorites(address);
  return favorites.some((f: any) => f.id === id && f.media_type === type);
};

export default {
  getWatchHistory,
  addToWatchHistory,
  getWatchProgress,
  saveWatchProgress,
  getContinueWatching,
  clearWatchHistory,
  getUserPreferences,
  saveUserPreferences,
  getSearchHistory,
  addToSearchHistory,
  clearSearchHistory
};
