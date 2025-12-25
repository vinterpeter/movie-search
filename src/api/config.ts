// TMDB API konfiguráció
// Regisztrálj a https://www.themoviedb.org/ oldalon és szerezd meg az API kulcsot
// Majd add hozzá a .env fájlhoz: VITE_TMDB_API_KEY=your_api_key

export const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export const IMAGE_SIZES = {
  poster: {
    small: 'w185',
    medium: 'w342',
    large: 'w500',
    original: 'original',
  },
  backdrop: {
    small: 'w300',
    medium: 'w780',
    large: 'w1280',
    original: 'original',
  },
  logo: {
    small: 'w45',
    medium: 'w92',
    large: 'w154',
  },
} as const;

export const getImageUrl = (
  path: string | null,
  size: string = IMAGE_SIZES.poster.medium
): string => {
  if (!path) {
    return '/placeholder-movie.svg';
  }
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

// Magyar régió és nyelv beállítások
export const REGION = 'HU';
export const LANGUAGE = 'hu-HU';
