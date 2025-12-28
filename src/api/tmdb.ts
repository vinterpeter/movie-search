import {
  TMDB_API_KEY,
  TMDB_BASE_URL,
  REGION,
  LANGUAGE,
} from './config';
import type {
  Movie,
  MovieDetails,
  TVShow,
  TVShowDetails,
  Genre,
  WatchProvider,
  WatchProviderResult,
  Certification,
  TMDBResponse,
  Video,
  MediaType,
  CinemaData,
  CinemaMovie,
} from '../types/movie';

const fetchFromTMDB = async <T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> => {
  const searchParams = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: LANGUAGE,
    ...params,
  });

  const response = await fetch(`${TMDB_BASE_URL}${endpoint}?${searchParams}`);

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }

  return response.json();
};

// Műfajok lekérése
export const getGenres = async (): Promise<Genre[]> => {
  const data = await fetchFromTMDB<{ genres: Genre[] }>('/genre/movie/list');
  return data.genres;
};

// Streaming szolgáltatók lekérése
export const getWatchProviders = async (): Promise<WatchProvider[]> => {
  const data = await fetchFromTMDB<{ results: WatchProvider[] }>(
    '/watch/providers/movie',
    { watch_region: REGION }
  );
  return data.results;
};

// Korosztályos besorolások lekérése (Magyar)
export const getCertifications = async (): Promise<Certification[]> => {
  const data = await fetchFromTMDB<{ certifications: Record<string, Certification[]> }>(
    '/certification/movie/list'
  );
  // Magyar besorolások, ha nincs, akkor US
  return data.certifications['HU'] || data.certifications['US'] || [];
};

// Népszerű filmek
export const getPopularMovies = async (page: number = 1): Promise<TMDBResponse<Movie>> => {
  return fetchFromTMDB<TMDBResponse<Movie>>('/movie/popular', {
    page: page.toString(),
    region: REGION,
  });
};

// Újonnan megjelent filmek (streaming)
export const getNewReleases = async (page: number = 1): Promise<TMDBResponse<Movie>> => {
  const today = new Date();
  const threeMonthsAgo = new Date(today.setMonth(today.getMonth() - 3));

  return fetchFromTMDB<TMDBResponse<Movie>>('/discover/movie', {
    page: page.toString(),
    region: REGION,
    sort_by: 'release_date.desc',
    'primary_release_date.gte': threeMonthsAgo.toISOString().split('T')[0],
    'primary_release_date.lte': new Date().toISOString().split('T')[0],
    with_watch_monetization_types: 'flatrate',
    watch_region: REGION,
  });
};

// Filmek keresése szűrőkkel
export const discoverMovies = async (
  page: number = 1,
  filters: {
    genres?: number[];
    certification?: string;
    providers?: number[];
    sortBy?: string;
    minRating?: number;
    yearFrom?: number;
    yearTo?: number;
  } = {}
): Promise<TMDBResponse<Movie>> => {
  const params: Record<string, string> = {
    page: page.toString(),
    region: REGION,
    watch_region: REGION,
    with_watch_monetization_types: 'flatrate',
    sort_by: filters.sortBy || 'popularity.desc',
  };

  if (filters.genres && filters.genres.length > 0) {
    params.with_genres = filters.genres.join(',');
  }

  if (filters.certification) {
    params.certification_country = 'HU';
    params.certification = filters.certification;
  }

  if (filters.providers && filters.providers.length > 0) {
    params.with_watch_providers = filters.providers.join('|');
  }

  if (filters.minRating && filters.minRating > 0) {
    params['vote_average.gte'] = filters.minRating.toString();
    // Minimum szavazatok szűrése, hogy ne jöjjenek be ismeretlen filmek
    params['vote_count.gte'] = '50';
  }

  if (filters.yearFrom) {
    params['primary_release_date.gte'] = `${filters.yearFrom}-01-01`;
  }

  if (filters.yearTo) {
    params['primary_release_date.lte'] = `${filters.yearTo}-12-31`;
  }

  return fetchFromTMDB<TMDBResponse<Movie>>('/discover/movie', params);
};

// Film részletek lekérése
export const getMovieDetails = async (movieId: number): Promise<MovieDetails> => {
  return fetchFromTMDB<MovieDetails>(`/movie/${movieId}`);
};

// Film streaming elérhetőségei
export const getMovieWatchProviders = async (
  movieId: number
): Promise<WatchProviderResult | null> => {
  const data = await fetchFromTMDB<{ results: Record<string, WatchProviderResult> }>(
    `/movie/${movieId}/watch/providers`
  );
  return data.results[REGION] || data.results['US'] || null;
};

// Keresés szöveggel
export const searchMovies = async (
  query: string,
  page: number = 1
): Promise<TMDBResponse<Movie>> => {
  return fetchFromTMDB<TMDBResponse<Movie>>('/search/movie', {
    query,
    page: page.toString(),
    include_adult: 'false',
  });
};

// Sorozat keresése szöveggel
export const searchTV = async (
  query: string,
  page: number = 1
): Promise<TMDBResponse<TVShow>> => {
  return fetchFromTMDB<TMDBResponse<TVShow>>('/search/tv', {
    query,
    page: page.toString(),
    include_adult: 'false',
  });
};

// ===== TV SHOW (SOROZAT) FUNKCIÓK =====

// Sorozat műfajok lekérése
export const getTVGenres = async (): Promise<Genre[]> => {
  const data = await fetchFromTMDB<{ genres: Genre[] }>('/genre/tv/list');
  return data.genres;
};

// Sorozat streaming szolgáltatók
export const getTVWatchProviders = async (): Promise<WatchProvider[]> => {
  const data = await fetchFromTMDB<{ results: WatchProvider[] }>(
    '/watch/providers/tv',
    { watch_region: REGION }
  );
  return data.results;
};

// Sorozatok keresése szűrőkkel
export const discoverTV = async (
  page: number = 1,
  filters: {
    genres?: number[];
    providers?: number[];
    sortBy?: string;
    minRating?: number;
    yearFrom?: number;
    yearTo?: number;
  } = {}
): Promise<TMDBResponse<TVShow>> => {
  const params: Record<string, string> = {
    page: page.toString(),
    watch_region: REGION,
    with_watch_monetization_types: 'flatrate',
    sort_by: filters.sortBy || 'popularity.desc',
  };

  if (filters.genres && filters.genres.length > 0) {
    params.with_genres = filters.genres.join(',');
  }

  if (filters.providers && filters.providers.length > 0) {
    params.with_watch_providers = filters.providers.join('|');
  }

  if (filters.minRating && filters.minRating > 0) {
    params['vote_average.gte'] = filters.minRating.toString();
    params['vote_count.gte'] = '50';
  }

  if (filters.yearFrom) {
    params['first_air_date.gte'] = `${filters.yearFrom}-01-01`;
  }

  if (filters.yearTo) {
    params['first_air_date.lte'] = `${filters.yearTo}-12-31`;
  }

  return fetchFromTMDB<TMDBResponse<TVShow>>('/discover/tv', params);
};

// Sorozat részletek
export const getTVDetails = async (tvId: number): Promise<TVShowDetails> => {
  return fetchFromTMDB<TVShowDetails>(`/tv/${tvId}`);
};

// Sorozat streaming elérhetőségei
export const getTVWatchProvidersForShow = async (
  tvId: number
): Promise<WatchProviderResult | null> => {
  const data = await fetchFromTMDB<{ results: Record<string, WatchProviderResult> }>(
    `/tv/${tvId}/watch/providers`
  );
  return data.results[REGION] || data.results['US'] || null;
};

// ===== VIDEO/TRAILER FUNKCIÓK =====

// Film előzetesek és videók lekérése
export const getMovieVideos = async (movieId: number): Promise<Video[]> => {
  const data = await fetchFromTMDB<{ results: Video[] }>(
    `/movie/${movieId}/videos`,
    { language: 'hu-HU' }
  );
  // Ha nincs magyar, próbáljuk angolul
  if (data.results.length === 0) {
    const enData = await fetchFromTMDB<{ results: Video[] }>(
      `/movie/${movieId}/videos`,
      { language: 'en-US' }
    );
    return enData.results;
  }
  return data.results;
};

// Sorozat előzetesek és videók lekérése
export const getTVVideos = async (tvId: number): Promise<Video[]> => {
  const data = await fetchFromTMDB<{ results: Video[] }>(
    `/tv/${tvId}/videos`,
    { language: 'hu-HU' }
  );
  // Ha nincs magyar, próbáljuk angolul
  if (data.results.length === 0) {
    const enData = await fetchFromTMDB<{ results: Video[] }>(
      `/tv/${tvId}/videos`,
      { language: 'en-US' }
    );
    return enData.results;
  }
  return data.results;
};

// Általános videó lekérés média típus alapján
export const getVideos = async (mediaType: MediaType, id: number): Promise<Video[]> => {
  return mediaType === 'movie' ? getMovieVideos(id) : getTVVideos(id);
};

// Legjobb trailer kiválasztása
export const getBestTrailer = (videos: Video[]): Video | null => {
  // Előnyben részesítjük: hivatalos YouTube trailereket
  const trailers = videos.filter(
    v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
  );

  // Hivatalos trailert preferáljuk
  const official = trailers.find(v => v.official);
  if (official) return official;

  // Bármilyen trailer
  if (trailers.length > 0) return trailers[0];

  // Ha nincs trailer, bármilyen YouTube videó
  const youtubeVideos = videos.filter(v => v.site === 'YouTube');
  return youtubeVideos.length > 0 ? youtubeVideos[0] : null;
};

// ===== TRENDING / UPCOMING / NOW PLAYING =====

// Felkapott filmek (trending)
export const getTrendingMovies = async (
  timeWindow: 'day' | 'week' = 'week'
): Promise<TMDBResponse<Movie>> => {
  return fetchFromTMDB<TMDBResponse<Movie>>(`/trending/movie/${timeWindow}`, {
    region: REGION,
  });
};

// Felkapott sorozatok (trending)
export const getTrendingTV = async (
  timeWindow: 'day' | 'week' = 'week'
): Promise<TMDBResponse<TVShow>> => {
  return fetchFromTMDB<TMDBResponse<TVShow>>(`/trending/tv/${timeWindow}`);
};

// Hamarosan megjelenő filmek (upcoming)
export const getUpcomingMovies = async (page: number = 1): Promise<TMDBResponse<Movie>> => {
  return fetchFromTMDB<TMDBResponse<Movie>>('/movie/upcoming', {
    page: page.toString(),
    region: REGION,
  });
};

// Most a mozikban (now playing) - TMDB fallback
export const getNowPlayingMovies = async (page: number = 1): Promise<TMDBResponse<Movie>> => {
  return fetchFromTMDB<TMDBResponse<Movie>>('/movie/now_playing', {
    page: page.toString(),
    region: REGION,
  });
};

// Hungarian cinema data from static JSON (Cinema City API)
let cachedCinemaData: CinemaData | null = null;

export const getHungarianCinemaData = async (): Promise<CinemaData | null> => {
  if (cachedCinemaData) return cachedCinemaData;

  try {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const response = await fetch(`${baseUrl}data/cinema.json`);
    if (!response.ok) {
      console.warn('Hungarian cinema data not available');
      return null;
    }

    cachedCinemaData = await response.json();
    return cachedCinemaData;
  } catch (error) {
    console.error('Error loading Hungarian cinema data:', error);
    return null;
  }
};

// Hungarian cinema movies with optional filtering
export const getHungarianCinemaMovies = async (filters?: {
  city?: string;
  date?: string;
  genres?: number[];
  minRating?: number;
  sortBy?: string;
}): Promise<TMDBResponse<Movie>> => {
  try {
    const cinemaData = await getHungarianCinemaData();

    if (!cinemaData) {
      console.warn('Hungarian cinema data not available, falling back to TMDB');
      return getNowPlayingMovies(1);
    }

    let filteredMovies = cinemaData.movies as CinemaMovie[];

    // Filter by city
    if (filters?.city) {
      filteredMovies = filteredMovies.filter(movie =>
        movie.cities.includes(filters.city!)
      );
    }

    // Filter by date
    if (filters?.date) {
      filteredMovies = filteredMovies.filter(movie =>
        movie.dates.includes(filters.date!)
      );
    }

    // Filter by genre
    if (filters?.genres && filters.genres.length > 0) {
      filteredMovies = filteredMovies.filter(movie =>
        filters.genres!.some(genreId => movie.genre_ids.includes(genreId))
      );
    }

    // Filter by minimum rating
    if (filters?.minRating && filters.minRating > 0) {
      filteredMovies = filteredMovies.filter(movie =>
        movie.vote_average >= filters.minRating!
      );
    }

    // Sort
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'vote_average.desc':
          filteredMovies.sort((a, b) => b.vote_average - a.vote_average);
          break;
        case 'primary_release_date.desc':
          filteredMovies.sort((a, b) =>
            new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
          );
          break;
        case 'title.asc':
          filteredMovies.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'screenings.desc':
          filteredMovies.sort((a, b) => b.screeningCount - a.screeningCount);
          break;
        // popularity.desc is default
        default:
          filteredMovies.sort((a, b) => b.screeningCount - a.screeningCount);
      }
    }

    return {
      page: 1,
      results: filteredMovies as Movie[],
      total_pages: 1,
      total_results: filteredMovies.length,
    };
  } catch (error) {
    console.error('Error loading Hungarian cinema data:', error);
    return getNowPlayingMovies(1);
  }
};

// Most adásban lévő sorozatok (on the air)
export const getOnTheAirTV = async (page: number = 1): Promise<TMDBResponse<TVShow>> => {
  return fetchFromTMDB<TMDBResponse<TVShow>>('/tv/on_the_air', {
    page: page.toString(),
  });
};
