/**
 * Hungarian Cinema Scraper
 *
 * This script scrapes mozinezo.hu for current Hungarian cinema releases
 * and matches them with TMDB for metadata. Output is a static JSON file.
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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeMozinezo() {
  const currentYear = new Date().getFullYear();
  const url = `https://www.mozinezo.hu/mozi-premier-filmek-${currentYear}`;

  console.log(`Fetching ${url}...`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch mozinezo: ${response.status}`);
    }

    const html = await response.text();
    const movies = [];

    // Parse HTML to extract movie titles
    // Look for links matching pattern: /filmek/[slug].mozi
    const filmLinkRegex = /<a[^>]*href="(https:\/\/www\.mozinezo\.hu\/filmek\/[^"]+\.mozi)"[^>]*>([^<]+)<\/a>/gi;
    let match;

    while ((match = filmLinkRegex.exec(html)) !== null) {
      const filmUrl = match[1];
      let title = match[2].trim();

      // Extract year from title if present (e.g., "Nosferatu (2024)")
      const yearMatch = title.match(/\((\d{4})\)$/);
      const year = yearMatch ? parseInt(yearMatch[1]) : currentYear;
      title = title.replace(/\s*\(\d{4}\)$/, '').trim();

      // Only include recent movies (current year and previous year)
      if (year >= currentYear - 1) {
        movies.push({
          title,
          year,
          url: filmUrl,
        });
      }
    }

    // Remove duplicates
    const uniqueMovies = movies.filter((movie, index, self) =>
      index === self.findIndex((m) => m.title.toLowerCase() === movie.title.toLowerCase())
    );

    console.log(`Found ${uniqueMovies.length} unique movies from mozinezo.hu`);
    return uniqueMovies;
  } catch (error) {
    console.error('Error scraping mozinezo:', error);
    return [];
  }
}

async function searchTMDB(title, year) {
  if (!TMDB_API_KEY) {
    console.error('TMDB API key not set! Set VITE_TMDB_API_KEY environment variable.');
    return null;
  }

  const encodedTitle = encodeURIComponent(title);
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodedTitle}&year=${year}&language=hu-HU&region=HU`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`TMDB search failed for "${title}": ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.results.length > 0) {
      return data.results[0];
    }

    // Try without year
    const urlNoYear = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodedTitle}&language=hu-HU&region=HU`;
    const responseNoYear = await fetch(urlNoYear);
    if (!responseNoYear.ok) return null;

    const dataNoYear = await responseNoYear.json();
    return dataNoYear.results[0] || null;
  } catch (error) {
    console.error(`Error searching TMDB for "${title}":`, error);
    return null;
  }
}

async function getTMDBNowPlaying() {
  if (!TMDB_API_KEY) {
    console.error('TMDB API key not set!');
    return [];
  }

  console.log('Fetching TMDB now_playing as fallback...');
  const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=hu-HU&region=HU&page=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();

    return data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      original_title: movie.original_title,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      overview: movie.overview,
      genre_ids: movie.genre_ids,
      popularity: movie.popularity,
      adult: movie.adult || false,
    }));
  } catch (error) {
    console.error('Error fetching TMDB now_playing:', error);
    return [];
  }
}

async function main() {
  console.log('Starting Hungarian Cinema update...\n');

  // Scrape mozinezo for movie titles
  const scrapedMovies = await scrapeMozinezo();

  let movies = [];

  if (scrapedMovies.length === 0) {
    console.log('No movies found from mozinezo, using TMDB fallback...');
    movies = await getTMDBNowPlaying();
  } else {
    // Match with TMDB for metadata
    console.log('\nMatching with TMDB...');

    for (const scraped of scrapedMovies) {
      console.log(`  Searching: ${scraped.title} (${scraped.year})`);
      const tmdbResult = await searchTMDB(scraped.title, scraped.year);

      if (tmdbResult) {
        movies.push({
          id: tmdbResult.id,
          title: tmdbResult.title || scraped.title,
          original_title: tmdbResult.original_title,
          poster_path: tmdbResult.poster_path,
          backdrop_path: tmdbResult.backdrop_path,
          release_date: tmdbResult.release_date,
          vote_average: tmdbResult.vote_average,
          vote_count: tmdbResult.vote_count,
          overview: tmdbResult.overview,
          genre_ids: tmdbResult.genre_ids,
          popularity: tmdbResult.popularity,
          adult: tmdbResult.adult || false,
        });
        console.log(`    ✓ Found: ${tmdbResult.title} (ID: ${tmdbResult.id})`);
      } else {
        console.log(`    ✗ Not found in TMDB`);
      }

      // Rate limiting - TMDB allows 40 requests per 10 seconds
      await sleep(250);
    }
  }

  // Sort by popularity
  movies.sort((a, b) => b.popularity - a.popularity);

  // Remove duplicates by ID
  const uniqueMovies = movies.filter((movie, index, self) =>
    index === self.findIndex((m) => m.id === movie.id)
  );

  // Prepare output
  const output = {
    lastUpdated: new Date().toISOString(),
    count: uniqueMovies.length,
    movies: uniqueMovies,
  };

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write to file
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  console.log(`\n✓ Saved ${uniqueMovies.length} movies to ${OUTPUT_PATH}`);
  console.log(`  Last updated: ${output.lastUpdated}`);
}

main().catch(console.error);
