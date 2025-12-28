import { useState, useEffect, useCallback } from 'react';
import type { Movie, TVShow, TMDBResponse, MediaType, BrowseMode } from '../types/movie';
import {
  discoverMovies,
  discoverTV,
  getTrendingMovies,
  getTrendingTV,
  getUpcomingMovies,
  getHungarianCinemaMovies,
} from '../api/tmdb';

interface UseMoviesOptions {
  mediaType?: MediaType;
  browseMode?: BrowseMode;
  genres?: number[];
  certification?: string;
  providers?: number[];
  sortBy?: string;
  minRating?: number;
  yearFrom?: number;
  yearTo?: number;
}

interface UseMoviesReturn {
  items: (Movie | TVShow)[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  totalResults: number;
  loadMore: () => void;
  refresh: () => void;
}

export const useMovies = (options: UseMoviesOptions = {}): UseMoviesReturn => {
  const [items, setItems] = useState<(Movie | TVShow)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  const mediaType = options.mediaType || 'movie';
  const browseMode = options.browseMode || 'streaming';

  const fetchItems = useCallback(
    async (pageNum: number, append: boolean = false) => {
      setLoading(true);
      setError(null);

      try {
        let data: TMDBResponse<Movie | TVShow>;

        // Speciális browse módok kezelése
        if (browseMode === 'trending') {
          if (mediaType === 'tv') {
            data = await getTrendingTV('week');
          } else {
            data = await getTrendingMovies('week');
          }
        } else if (browseMode === 'upcoming' && mediaType === 'movie') {
          data = await getUpcomingMovies(pageNum);
        } else if (browseMode === 'theaters' && mediaType === 'movie') {
          // Magyar mozikban játszott filmek (mozinezo.hu-ról)
          data = await getHungarianCinemaMovies();
          // Kliens oldali szűrés a mozi filmekre
          let filteredResults = data.results as Movie[];

          // Műfaj szűrés
          if (options.genres && options.genres.length > 0) {
            filteredResults = filteredResults.filter(movie =>
              options.genres!.some(genreId => movie.genre_ids.includes(genreId))
            );
          }

          // Minimum értékelés szűrés
          if (options.minRating && options.minRating > 0) {
            filteredResults = filteredResults.filter(movie =>
              movie.vote_average >= options.minRating!
            );
          }

          // Rendezés
          if (options.sortBy) {
            switch (options.sortBy) {
              case 'vote_average.desc':
                filteredResults.sort((a, b) => b.vote_average - a.vote_average);
                break;
              case 'primary_release_date.desc':
                filteredResults.sort((a, b) =>
                  new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
                );
                break;
              case 'title.asc':
                filteredResults.sort((a, b) => a.title.localeCompare(b.title));
                break;
              // popularity.desc az alapértelmezett, nem kell rendezni
            }
          }

          data = { ...data, results: filteredResults };
        } else {
          // Alapértelmezett: streaming discover
          if (mediaType === 'tv') {
            data = await discoverTV(pageNum, {
              genres: options.genres,
              providers: options.providers,
              sortBy: options.sortBy,
              minRating: options.minRating,
              yearFrom: options.yearFrom,
              yearTo: options.yearTo,
            });
          } else {
            data = await discoverMovies(pageNum, {
              genres: options.genres,
              certification: options.certification,
              providers: options.providers,
              sortBy: options.sortBy,
              minRating: options.minRating,
              yearFrom: options.yearFrom,
              yearTo: options.yearTo,
            });
          }
        }

        setItems((prev) => (append ? [...prev, ...data.results] : data.results));
        setTotalPages(data.total_pages);
        setTotalResults(data.total_results);
        setPage(pageNum);
      } catch (err) {
        const errorMsg = mediaType === 'tv'
          ? 'Hiba történt a sorozatok betöltésekor'
          : 'Hiba történt a filmek betöltésekor';
        setError(err instanceof Error ? err.message : errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [mediaType, browseMode, options.genres, options.certification, options.providers, options.sortBy, options.minRating, options.yearFrom, options.yearTo]
  );

  useEffect(() => {
    setItems([]);
    fetchItems(1, false);
  }, [fetchItems]);

  const loadMore = useCallback(() => {
    if (page < totalPages && !loading) {
      fetchItems(page + 1, true);
    }
  }, [page, totalPages, loading, fetchItems]);

  const refresh = useCallback(() => {
    setItems([]);
    fetchItems(1, false);
  }, [fetchItems]);

  return {
    items,
    loading,
    error,
    page,
    totalPages,
    totalResults,
    loadMore,
    refresh,
  };
};
