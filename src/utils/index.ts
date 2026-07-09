import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Debounce function for search
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Format time for display
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Get image URLs with different sizes
export function getImageUrls(basePath: string | null) {
  if (!basePath) return {
    small: '/placeholder-movie.jpg',
    medium: '/placeholder-movie.jpg',
    large: '/placeholder-movie.jpg',
    original: '/placeholder-movie.jpg'
  }

  return {
    small: `https://image.tmdb.org/t/p/w300${basePath}`,
    medium: `https://image.tmdb.org/t/p/w500${basePath}`,
    large: `https://image.tmdb.org/t/p/w780${basePath}`,
    original: `https://image.tmdb.org/t/p/original${basePath}`
  }
}

// Check if device is mobile
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}

// Check if user prefers reduced motion
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substr(0, maxLength) + '...'
}

// Get year from date string
export function getYear(dateString: string): number {
  return new Date(dateString).getFullYear()
}

// Format date
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Calculate time ago
export function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  let interval = Math.floor(seconds / 31536000)
  if (interval > 1) return interval + " years ago"
  
  interval = Math.floor(seconds / 2592000)
  if (interval > 1) return interval + " months ago"
  
  interval = Math.floor(seconds / 86400)
  if (interval > 1) return interval + " days ago"
  
  interval = Math.floor(seconds / 3600)
  if (interval > 1) return interval + " hours ago"
  
  interval = Math.floor(seconds / 60)
  if (interval > 1) return interval + " minutes ago"
  
  return Math.floor(seconds) + " seconds ago"
}
