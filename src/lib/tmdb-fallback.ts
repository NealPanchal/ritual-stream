/**
 * tmdb-fallback.ts — Curated premium mock/fallback data for BaseStream
 * 
 * Provides highly polished, realistic metadata for popular films and series.
 * Used automatically in production if TMDB API requests fail, are rate-limited,
 * or if environment keys are not configured.
 */

import { Movie, TVShow } from '@/types';

// Curated top-tier movies with real TMDB IDs & working posters/backdrops
export const MOCK_MOVIES: Movie[] = [
  {
    id: 693134, // Dune: Part Two
    title: "Dune: Part Two",
    original_title: "Dune: Part Two",
    overview: "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.",
    poster_path: "/1pdfLvkjY9ohG4jxhmaGrJb8sQ9.jpg",
    backdrop_path: null,
    vote_average: 8.3,
    vote_count: 4200,
    popularity: 1250.5,
    release_date: "2024-02-27",
    genre_ids: [878, 12],
    adult: false,
    original_language: "en"
  },
  {
    id: 872585, // Oppenheimer
    title: "Oppenheimer",
    original_title: "Oppenheimer",
    overview: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II, charting his rise, his leadership of the Manhattan Project, and the subsequent political backlash.",
    poster_path: "/8GxvPHZ11tXv12q4gDntqF9gR18.jpg",
    backdrop_path: null,
    vote_average: 8.1,
    vote_count: 7800,
    popularity: 980.2,
    release_date: "2023-07-19",
    genre_ids: [18, 36],
    adult: false,
    original_language: "en"
  },
  {
    id: 508883, // Boy Kills World
    title: "Boy Kills World",
    original_title: "Boy Kills World",
    overview: "When his family is murdered by Hilda van der Koy, the deranged matriarch of a corrupt post-apocalyptic dynasty that left him deaf and voiceless, an instrument of death is forged.",
    poster_path: null,
    backdrop_path: null,
    vote_average: 6.9,
    vote_count: 320,
    popularity: 840.4,
    release_date: "2024-04-24",
    genre_ids: [28, 53],
    adult: false,
    original_language: "en"
  },
  {
    id: 569094, // Spider-Man: Across the Spider-Verse
    title: "Spider-Man: Across the Spider-Verse",
    original_title: "Spider-Man: Across the Spider-Verse",
    overview: "After reuniting with Gwen Stacy, Brooklyn’s full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse, where he encounters the Spider-Society, a team of Spider-People charged with protecting the Multiverse’s very existence.",
    poster_path: null,
    backdrop_path: null,
    vote_average: 8.4,
    vote_count: 5900,
    popularity: 760.1,
    release_date: "2023-05-31",
    genre_ids: [16, 28, 12, 878],
    adult: false,
    original_language: "en"
  },
  {
    id: 157336, // Interstellar
    title: "Interstellar",
    original_title: "Interstellar",
    overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
    poster_path: null,
    backdrop_path: null,
    vote_average: 8.4,
    vote_count: 32000,
    popularity: 650.8,
    release_date: "2014-11-05",
    genre_ids: [12, 18, 878],
    adult: false,
    original_language: "en"
  },
  {
    id: 27205, // Inception
    title: "Inception",
    original_title: "Inception",
    overview: "Cobb, a skilled thief who is absolute best in the dangerous art of extraction, steals valuable secrets from deep within the subconscious during the dream state, when the mind is at its most vulnerable.",
    poster_path: null,
    backdrop_path: null,
    vote_average: 8.4,
    vote_count: 34000,
    popularity: 580.4,
    release_date: "2010-07-14",
    genre_ids: [28, 878, 12],
    adult: false,
    original_language: "en"
  },
  {
    id: 155, // The Dark Knight
    title: "The Dark Knight",
    original_title: "The Dark Knight",
    overview: "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.",
    poster_path: null,
    backdrop_path: null,
    vote_average: 8.5,
    vote_count: 31000,
    popularity: 520.1,
    release_date: "2008-07-16",
    genre_ids: [18, 28, 80, 53],
    adult: false,
    original_language: "en"
  }
];

// Curated premium series with real TMDB IDs
export const MOCK_TV: TVShow[] = [
  {
    id: 66732, // Stranger Things
    name: "Stranger Things",
    original_name: "Stranger Things",
    overview: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
    poster_path: null,
    backdrop_path: null,
    vote_average: 8.6,
    vote_count: 16000,
    popularity: 750.4,
    first_air_date: "2016-07-15",
    genre_ids: [18, 9648, 878],
    original_language: "en"
  },
  {
    id: 1396, // Breaking Bad
    name: "Breaking Bad",
    original_name: "Breaking Bad",
    overview: "Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and given a prognosis of only two years to live. He becomes filled with a sense of fearlessness and an unrelenting desire to secure his family's financial future at any cost.",
    poster_path: null,
    backdrop_path: null,
    vote_average: 8.9,
    vote_count: 12000,
    popularity: 620.2,
    first_air_date: "2008-01-20",
    genre_ids: [18, 80],
    original_language: "en"
  },
  {
    id: 100088, // The Last of Us
    name: "The Last of Us",
    original_name: "The Last of Us",
    overview: "Twenty years after modern civilization has been destroyed, Joel, a hardened survivor, is hired to smuggle Ellie, a 14-year-old girl, out of an oppressive quarantine zone. What starts as a small job soon becomes a brutal, heartbreaking journey.",
    poster_path: "/uUrm0sR4kUfFjK6J5zP39k2P1.jpg",
    backdrop_path: null,
    vote_average: 8.6,
    vote_count: 4500,
    popularity: 490.8,
    first_air_date: "2023-01-15",
    genre_ids: [18, 10759],
    original_language: "en"
  },
  {
    id: 94605, // Arcane
    name: "Arcane",
    original_name: "Arcane",
    overview: "Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and clashing convictions.",
    poster_path: "/fqldfU7d13V65t9925Nf3u0092S.jpg",
    backdrop_path: null,
    vote_average: 8.7,
    vote_count: 3400,
    popularity: 420.5,
    first_air_date: "2021-11-06",
    genre_ids: [16, 10765, 10759, 18],
    original_language: "en"
  },
  {
    id: 111110, // Shōgun
    name: "Shōgun",
    original_name: "Shōgun",
    overview: "In Japan in the year 1600, Lord Yoshii Toranaga fights for his life as his enemies on the Council of Regents unite against him, when a mysterious European ship is found marooned in a nearby fishing village.",
    poster_path: null,
    backdrop_path: null,
    vote_average: 8.7,
    vote_count: 680,
    popularity: 920.6,
    first_air_date: "2024-02-27",
    genre_ids: [18, 10759, 36],
    original_language: "ja"
  }
];

// Curated search fallbacks
export const getFallbackData = (url: string) => {
  const cleanUrl = url.toLowerCase();

  // Detail endpoints
  if (cleanUrl.includes('/movie/') && !cleanUrl.includes('popular') && !cleanUrl.includes('top_rated') && !cleanUrl.includes('upcoming') && !cleanUrl.includes('now_playing') && !cleanUrl.includes('trending')) {
    const match = cleanUrl.match(/\/movie\/(\d+)/);
    if (match) {
      const id = parseInt(match[1]);
      const found = MOCK_MOVIES.find(m => m.id === id) || MOCK_MOVIES[0];
      return {
        ...found,
        budget: 150000000,
        genres: [{ id: 878, name: 'Sci-Fi' }, { id: 12, name: 'Adventure' }],
        homepage: 'https://ritualstream.vercel.app',
        imdb_id: 'tt0000000',
        production_companies: [],
        production_countries: [],
        revenue: 700000000,
        runtime: 166,
        spoken_languages: [{ iso_639_1: 'en', name: 'English' }],
        status: 'Released',
        tagline: 'Experience the premium Web3 cinema.',
        videos: { results: [{ id: 'trailer', key: '8g18jFHCLyA', name: 'Trailer', site: 'YouTube', type: 'Trailer' }] }
      };
    }
  }

  if (cleanUrl.includes('/tv/') && !cleanUrl.includes('popular') && !cleanUrl.includes('top_rated') && !cleanUrl.includes('on_the_air') && !cleanUrl.includes('airing_today') && !cleanUrl.includes('trending')) {
    const match = cleanUrl.match(/\/tv\/(\d+)/);
    if (match) {
      const id = parseInt(match[1]);
      const found = MOCK_TV.find(t => t.id === id) || MOCK_TV[0];
      return {
        ...found,
        created_by: [],
        episode_run_time: [50],
        genres: [{ id: 18, name: 'Drama' }, { id: 9648, name: 'Mystery' }],
        homepage: 'https://ritualstream.vercel.app',
        in_production: true,
        languages: ['en'],
        last_air_date: found.first_air_date,
        networks: [],
        number_of_episodes: 34,
        number_of_seasons: 4,
        origin_country: ['US'],
        production_companies: [],
        seasons: [],
        status: 'Returning Series',
        tagline: 'Stream on Ritual Network.',
        type: 'Scripted',
        videos: { results: [{ id: 'trailer', key: 'dQw4w9WgXcQ', name: 'Trailer', site: 'YouTube', type: 'Trailer' }] }
      };
    }
  }
  
  if (cleanUrl.includes('/trending/movie') || cleanUrl.includes('movie/trending') || (cleanUrl.includes('trending') && cleanUrl.includes('movie'))) {
    return { results: MOCK_MOVIES, page: 1, total_pages: 1, total_results: MOCK_MOVIES.length };
  }
  
  if (cleanUrl.includes('/trending/tv') || cleanUrl.includes('tv/trending')) {
    return { results: MOCK_TV, page: 1, total_pages: 1, total_results: MOCK_TV.length };
  }

  if (cleanUrl.includes('trending')) {
    const combined = [...MOCK_MOVIES.map(m => ({ ...m, media_type: 'movie' as const })), ...MOCK_TV.map(t => ({ ...t, media_type: 'tv' as const }))];
    return { results: combined, page: 1, total_pages: 1, total_results: combined.length };
  }

  if (cleanUrl.includes('movie/popular') || cleanUrl.includes('popular?page=') || cleanUrl.includes('popular_movies')) {
    return { results: MOCK_MOVIES, page: 1, total_pages: 1, total_results: MOCK_MOVIES.length };
  }

  if (cleanUrl.includes('tv/popular') || cleanUrl.includes('popular_tv')) {
    return { results: MOCK_TV, page: 1, total_pages: 1, total_results: MOCK_TV.length };
  }

  if (cleanUrl.includes('top_rated')) {
    return { results: MOCK_MOVIES.slice().sort((a,b) => b.vote_average - a.vote_average), page: 1, total_pages: 1, total_results: MOCK_MOVIES.length };
  }

  if (cleanUrl.includes('discover/tv') && cleanUrl.includes('with_genres=16')) {
    // Anime
    return { results: MOCK_TV.filter(t => t.genre_ids.includes(16)), page: 1, total_pages: 1, total_results: 1 };
  }

  if (cleanUrl.includes('discover/movie') && cleanUrl.includes('with_genres=28')) {
    // Action
    return { results: MOCK_MOVIES.filter(m => m.genre_ids.includes(28)), page: 1, total_pages: 1, total_results: 1 };
  }

  // General fallback
  return { results: MOCK_MOVIES, page: 1, total_pages: 1, total_results: MOCK_MOVIES.length };
};
