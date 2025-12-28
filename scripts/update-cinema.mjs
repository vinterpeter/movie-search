/**
 * Hungarian Cinema Scraper with Screening Times
 *
 * This script fetches Cinema City Hungary screening data via their API
 * and matches with TMDB for Hungarian metadata.
 *
 * Run: node scripts/update-cinema.mjs
 * Or via npm: npm run update-cinema
 *
 * Requires: VITE_TMDB_API_KEY environment variable
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TMDB_API_KEY = process.env.VITE_TMDB_API_KEY || '';
const OUTPUT_PATH = path.join(__dirname, '../public/data/cinema.json');

// Cinema City Hungary locations
const CINEMAS = [
  { id: '1132', name: 'Arena', city: 'Budapest' },
  { id: '1133', name: 'Allee', city: 'Budapest' },
  { id: '1139', name: 'Campona', city: 'Budapest' },
  { id: '1141', name: 'Duna Pláza', city: 'Budapest' },
  { id: '1144', name: 'Mammut', city: 'Budapest' },
  { id: '1137', name: 'Westend', city: 'Budapest' },
  { id: '1127', name: 'Cinema City', city: 'Debrecen' },
  { id: '1125', name: 'Cinema City', city: 'Győr' },
  { id: '1129', name: 'Cinema City', city: 'Miskolc' },
  { id: '1128', name: 'Cinema City', city: 'Pécs' },
  { id: '1126', name: 'Cinema City', city: 'Szeged' },
  { id: '1124', name: 'Alba', city: 'Székesfehérvár' },
  { id: '1131', name: 'Balaton', city: 'Veszprém' },
  { id: '1143', name: 'Cinema City', city: 'Nyíregyháza' },
  { id: '1130', name: 'Cinema City', city: 'Szolnok' },
  { id: '1134', name: 'Savaria', city: 'Szombathely' },
  { id: '1136', name: 'Cinema City', city: 'Sopron' },
  { id: '1135', name: 'Cinema City', city: 'Zalaegerszeg' },
];

// Get unique cities
const CITIES = [...new Set(CINEMAS.map(c => c.city))].sort();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function getNextDays(days = 7) {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(formatDate(date));
  }
  return dates;
}

async function fetchCinemaCityData(cinemaId, date) {
  const url = `https://www.cinemacity.hu/hu/data-api-service/v1/quickbook/10102/film-events/in-cinema/${cinemaId}/at-date/${date}?attr=&lang=hu_HU`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`  Failed to fetch cinema ${cinemaId} for ${date}: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`  Error fetching cinema ${cinemaId}:`, error.message);
    return null;
  }
}

async function searchTMDB(title, year) {
  if (!TMDB_API_KEY) return null;

  const encodedTitle = encodeURIComponent(title);
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodedTitle}&year=${year}&language=hu-HU&region=HU`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.results.length > 0) return data.results[0];

    // Try without year
    const urlNoYear = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodedTitle}&language=hu-HU&region=HU`;
    const responseNoYear = await fetch(urlNoYear);
    if (!responseNoYear.ok) return null;

    const dataNoYear = await responseNoYear.json();
    return dataNoYear.results[0] || null;
  } catch (error) {
    return null;
  }
}

async function main() {
  console.log('Starting Hungarian Cinema update with screening times...\n');

  const dates = getNextDays(7);
  console.log(`Fetching data for dates: ${dates[0]} to ${dates[dates.length - 1]}`);
  console.log(`Fetching from ${CINEMAS.length} Cinema City locations...\n`);

  // Collect all movies and screenings
  const movieMap = new Map(); // tmdbId -> movie data
  const screeningsMap = new Map(); // tmdbId -> screenings[]

  for (const cinema of CINEMAS) {
    console.log(`\nProcessing ${cinema.name} (${cinema.city})...`);

    for (const date of dates) {
      const data = await fetchCinemaCityData(cinema.id, date);

      if (!data?.body?.films || !data?.body?.events) {
        continue;
      }

      const { films, events } = data.body;

      // Process each film
      for (const film of films) {
        // Get events for this film
        const filmEvents = events.filter(e => e.filmId === film.id);
        if (filmEvents.length === 0) continue;

        // Check if we already have this movie
        let movieData = movieMap.get(film.id);

        if (!movieData) {
          // Try to match with TMDB for Hungarian metadata
          const releaseYear = film.releaseYear || new Date().getFullYear();
          const tmdbResult = await searchTMDB(film.name, releaseYear);

          if (tmdbResult) {
            movieData = {
              id: tmdbResult.id,
              cinemaCityId: film.id,
              title: tmdbResult.title,
              original_title: tmdbResult.original_title || film.name,
              poster_path: tmdbResult.poster_path,
              backdrop_path: tmdbResult.backdrop_path,
              release_date: tmdbResult.release_date || `${releaseYear}-01-01`,
              vote_average: tmdbResult.vote_average || 0,
              vote_count: tmdbResult.vote_count || 0,
              overview: tmdbResult.overview || '',
              genre_ids: tmdbResult.genre_ids || [],
              popularity: tmdbResult.popularity || 0,
              adult: tmdbResult.adult || false,
            };
            console.log(`    ✓ TMDB match: ${film.name} -> ${tmdbResult.title}`);
          } else {
            // Use Cinema City data directly
            movieData = {
              id: `cc-${film.id}`,
              cinemaCityId: film.id,
              title: film.name,
              original_title: film.name,
              poster_path: film.posterLink ? film.posterLink.replace('https://www.cinemacity.hu', '') : null,
              backdrop_path: null,
              release_date: `${releaseYear}-01-01`,
              vote_average: 0,
              vote_count: 0,
              overview: '',
              genre_ids: [],
              popularity: 0,
              adult: false,
              cinemaCityPoster: film.posterLink || null,
            };
            console.log(`    ○ No TMDB match: ${film.name}`);
          }

          movieMap.set(film.id, movieData);
          screeningsMap.set(film.id, []);

          // Rate limiting for TMDB
          await sleep(100);
        }

        // Add screenings for this film at this cinema on this date
        const movieScreenings = screeningsMap.get(film.id);

        for (const event of filmEvents) {
          movieScreenings.push({
            cinemaId: cinema.id,
            cinemaName: cinema.name,
            city: cinema.city,
            date: date,
            time: event.eventDateTime ? event.eventDateTime.split('T')[1]?.substring(0, 5) : '',
            auditorium: event.auditorium || '',
            format: event.attributeIds?.join(', ') || '',
            bookingLink: event.bookingLink || null,
          });
        }
      }

      // Small delay between requests
      await sleep(50);
    }
  }

  // Convert to arrays and attach screenings
  const movies = [];
  for (const [cinemaCityId, movieData] of movieMap) {
    const screenings = screeningsMap.get(cinemaCityId) || [];

    // Sort screenings by date and time
    screenings.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    // Group screenings by city
    const screeningsByCity = {};
    for (const screening of screenings) {
      if (!screeningsByCity[screening.city]) {
        screeningsByCity[screening.city] = [];
      }
      screeningsByCity[screening.city].push({
        cinemaId: screening.cinemaId,
        cinemaName: screening.cinemaName,
        date: screening.date,
        time: screening.time,
        auditorium: screening.auditorium,
        bookingLink: screening.bookingLink,
      });
    }

    movies.push({
      ...movieData,
      screenings: screeningsByCity,
      screeningCount: screenings.length,
      cities: Object.keys(screeningsByCity).sort(),
      dates: [...new Set(screenings.map(s => s.date))].sort(),
    });
  }

  // Sort by screening count (most shown first)
  movies.sort((a, b) => b.screeningCount - a.screeningCount);

  // Prepare output
  const output = {
    lastUpdated: new Date().toISOString(),
    count: movies.length,
    dates: dates,
    cities: CITIES,
    cinemas: CINEMAS,
    movies: movies,
  };

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write to file
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  console.log(`\n✓ Saved ${movies.length} movies with screenings to ${OUTPUT_PATH}`);
  console.log(`  Dates: ${dates[0]} to ${dates[dates.length - 1]}`);
  console.log(`  Cities: ${CITIES.join(', ')}`);
  console.log(`  Last updated: ${output.lastUpdated}`);
}

main().catch(console.error);
