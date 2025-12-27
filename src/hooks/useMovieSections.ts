import { useState, useEffect } from 'react';
import type { Movie, TVShow, MediaType } from '../types/movie';
import {
  getTrendingMovies,
  getTrendingTV,
  getUpcomingMovies,
  getNowPlayingMovies,
  getOnTheAirTV,
} from '../api/tmdb';

interface MovieSectionsData {
  trending: (Movie | TVShow)[];
  upcoming: Movie[];
  nowPlaying: Movie[];
  onTheAir: TVShow[];
  loading: boolean;
}

export const useMovieSections = (mediaType: MediaType): MovieSectionsData => {
  const [trending, setTrending] = useState<(Movie | TVShow)[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [onTheAir, setOnTheAir] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSections = async () => {
      setLoading(true);
      try {
        if (mediaType === 'movie') {
          const [trendingData, upcomingData, nowPlayingData] = await Promise.all([
            getTrendingMovies('week'),
            getUpcomingMovies(),
            getNowPlayingMovies(),
          ]);
          setTrending(trendingData.results.slice(0, 20));
          setUpcoming(upcomingData.results.slice(0, 20));
          setNowPlaying(nowPlayingData.results.slice(0, 20));
        } else {
          const [trendingData, onTheAirData] = await Promise.all([
            getTrendingTV('week'),
            getOnTheAirTV(),
          ]);
          setTrending(trendingData.results.slice(0, 20));
          setOnTheAir(onTheAirData.results.slice(0, 20));
        }
      } catch (error) {
        console.error('Error fetching movie sections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, [mediaType]);

  return {
    trending,
    upcoming,
    nowPlaying,
    onTheAir,
    loading,
  };
};
