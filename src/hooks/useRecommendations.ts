import { useState, useEffect, useCallback, useRef } from 'react';
import type { Movie, TVShow, FavoriteItem, MediaType, BrowseMode } from '../types/movie';
import { getMovieRecommendations, getTVRecommendations, getHungarianCinemaData } from '../api/tmdb';

interface RecommendationItem {
  item: Movie | TVShow;
  mediaType: MediaType;
  score: number; // Hányszor jelent meg az ajánlások között
  basedOn: string[]; // Melyik filmek alapján ajánljuk
}

interface UseRecommendationsReturn {
  recommendations: RecommendationItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useRecommendations = (
  lovedItems: FavoriteItem[],
  maxRecommendations: number = 20,
  filterMediaType: MediaType = 'movie',
  browseMode: BrowseMode = 'streaming'
): UseRecommendationsReturn => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchRecommendations = useCallback(async () => {
    // Csak a loved filmeket használjuk
    const itemsToUse = lovedItems.filter(item => item.loved);

    if (itemsToUse.length === 0) {
      setRecommendations([]);
      setLoading(false);
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      // Map az összes ajánlás összegyűjtéséhez
      // Key: `${mediaType}_${id}`, Value: RecommendationItem
      const recommendationMap = new Map<string, RecommendationItem>();

      // Loved items ID-k, hogy ne ajánljuk vissza őket
      const lovedIds = new Set(lovedItems.map(item => `${item.mediaType}_${item.id}`));

      // Theaters mode: get cinema movie IDs to filter by
      let cinemaMovieIds: Set<number> | null = null;
      if (browseMode === 'theaters') {
        const cinemaData = await getHungarianCinemaData();
        if (cinemaData) {
          cinemaMovieIds = new Set(cinemaData.movies.map(m => m.id));
        }
      }

      // Determine which mediaType to use for fetching recommendations
      // For theaters mode, we use movie recommendations from loved movies
      const targetMediaType = browseMode === 'theaters' ? 'movie' : filterMediaType;

      // Filter loved items by mediaType (for non-theaters mode, only use items matching the target type)
      // For theaters mode, we use loved movies to generate recommendations
      const filteredLovedItems = browseMode === 'theaters'
        ? itemsToUse.filter(item => item.mediaType === 'movie')
        : itemsToUse.filter(item => item.mediaType === targetMediaType);

      if (filteredLovedItems.length === 0) {
        setRecommendations([]);
        setLoading(false);
        return;
      }

      // Párhuzamosan kérjük le az ajánlásokat minden loved itemhez
      const promises = filteredLovedItems.map(async (favoriteItem) => {
        try {
          if (favoriteItem.mediaType === 'movie') {
            const response = await getMovieRecommendations(favoriteItem.id);
            return {
              basedOn: favoriteItem.title,
              mediaType: 'movie' as MediaType,
              results: response.results,
            };
          } else {
            const response = await getTVRecommendations(favoriteItem.id);
            return {
              basedOn: favoriteItem.title,
              mediaType: 'tv' as MediaType,
              results: response.results,
            };
          }
        } catch (e) {
          console.warn(`Failed to get recommendations for ${favoriteItem.title}:`, e);
          return null;
        }
      });

      const results = await Promise.all(promises);

      // Feldolgozzuk az eredményeket
      for (const result of results) {
        if (!result) continue;

        // Skip if mediaType doesn't match (except for theaters mode which we'll filter later)
        if (browseMode !== 'theaters' && result.mediaType !== targetMediaType) continue;

        for (const item of result.results) {
          const key = `${result.mediaType}_${item.id}`;

          // Ne ajánljuk vissza a loved/liked filmeket
          if (lovedIds.has(key)) continue;

          // For theaters mode, only include movies that are currently in cinemas
          if (browseMode === 'theaters' && cinemaMovieIds && !cinemaMovieIds.has(item.id)) {
            continue;
          }

          if (recommendationMap.has(key)) {
            // Már láttuk ezt a filmet, növeljük a score-t
            const existing = recommendationMap.get(key)!;
            existing.score += 1;
            if (!existing.basedOn.includes(result.basedOn)) {
              existing.basedOn.push(result.basedOn);
            }
          } else {
            // Új ajánlás
            recommendationMap.set(key, {
              item,
              mediaType: result.mediaType,
              score: 1,
              basedOn: [result.basedOn],
            });
          }
        }
      }

      // Rendezzük score szerint (csökkenő), majd rating szerint
      const sortedRecommendations = Array.from(recommendationMap.values())
        .sort((a, b) => {
          // Először score szerint
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          // Majd rating szerint
          return b.item.vote_average - a.item.vote_average;
        })
        .slice(0, maxRecommendations);

      setRecommendations(sortedRecommendations);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        return;
      }
      console.error('Failed to fetch recommendations:', e);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, [lovedItems, maxRecommendations, filterMediaType, browseMode]);

  // Automatikus frissítés, amikor a loved items vagy filter változik
  useEffect(() => {
    fetchRecommendations();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchRecommendations]);

  const refresh = useCallback(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    loading,
    error,
    refresh,
  };
};
