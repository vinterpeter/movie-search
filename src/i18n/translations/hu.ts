export const hu = {
  // Header
  appTitle: 'Film Kereső',
  movies: 'Filmek',
  tvShows: 'Sorozatok',
  theaters: 'Mozi',
  searchMoviePlaceholder: 'Film keresése...',
  searchTvPlaceholder: 'Sorozat keresése...',
  watchlist: 'Watchlist',

  // Filter Panel
  filters: 'Szűrők',
  clearFilters: 'Törlés',
  sortBy: 'Rendezés',
  sortMostPopular: 'Legnépszerűbb',
  sortBestRated: 'Legjobb értékelés',
  sortNewest: 'Legújabb',
  sortTitleAZ: 'Cím (A-Z)',
  minimumRating: 'Minimum értékelés',
  ratingAny: 'Mindegy',
  releaseYear: 'Megjelenés éve',
  yearFrom: 'Évtől',
  yearTo: 'Évig',
  categories: 'Kategóriák',
  ageRating: 'Korosztály',
  all: 'Mind',
  streamingProviders: 'Streaming szolgáltatók',

  // Age Rating descriptions (certifications)
  certKN: 'Korhatár nélkül',
  cert6: '6 éven felülieknek',
  cert12: '12 éven felülieknek',
  cert16: '16 éven felülieknek',
  cert18: '18 éven felülieknek',
  certG: 'Minden korosztálynak',
  certPG: 'Szülői felügyelettel',
  certPG13: '13 év felett',
  certR: '17 év alatt szülővel',
  certNC17: '18 év felett',

  // Movie Card
  tvShow: 'Sorozat',
  movie: 'Film',

  // Movie Grid
  noMoviesFound: 'Nem találtunk filmeket a megadott szűrőkkel.',
  noTvShowsFound: 'Nem találtunk sorozatokat a megadott szűrőkkel.',
  tryDifferentFilters: 'Próbáld meg módosítani a keresési feltételeket.',
  loadingMovies: 'Filmek betöltése...',
  loadingTvShows: 'Sorozatok betöltése...',
  loadMoreMovies: 'Több film betöltése',
  loadMoreTvShows: 'Több sorozat betöltése',

  // Movie Modal
  trailer: 'Előzetes',
  inWatchlist: 'Watchlistben',
  addToWatchlist: 'Watchlisthez',
  minutes: 'perc',
  seasons: 'évad',
  episodes: 'epizód',
  noDescription: 'Nincs elérhető leírás.',
  availableOnStreaming: 'Elérhető streaming szolgáltatóknál:',
  withSubscription: 'Előfizetéssel:',
  rentable: 'Kölcsönözhető:',
  purchasable: 'Megvásárolható:',
  noStreamingProviders: 'Jelenleg nincs elérhető streaming szolgáltató.',
  viewOnJustWatch: 'Megtekintés a JustWatch-on',

  // Watchlist
  list: 'Lista',
  add: 'Hozzáadás',
  searchAnyMovieOrTv: 'Keress bármilyen filmet vagy sorozatot...',
  search: 'Keresés',
  searching: 'Keresés...',
  noSearchResults: 'Nincs találat a keresésre.',
  searchAnyInterest: 'Keress rá bármilyen filmre vagy sorozatra, ami érdekel!',
  addEvenIfNotAvailable: 'Akkor is hozzáadhatod, ha még nem érhető el streamingnél.',
  checkingAvailability: 'Elérhetőség ellenőrzése...',
  watchlistEmpty: 'A watchlist üres.',
  clickAddTab: 'Kattints a "+ Hozzáadás" fülre filmek kereséséhez!',
  checking: 'Ellenőrzés...',
  available: 'Elérhető',
  notAvailable: 'Nem elérhető',
  addedOn: 'Hozzáadva',
  checkedToday: 'Ma ellenőrizve',
  checkedYesterday: 'Tegnap ellenőrizve',
  checkedDaysAgo: '{days} napja ellenőrizve',
  checkedOnDate: '{date}-kor ellenőrizve',
  refreshAvailability: 'Elérhetőség frissítése',
  markAsWatched: 'Megjelölés látottként',
  markAsUnwatched: 'Megjelölés nem látottként',
  removeFromList: 'Eltávolítás a listából',
  watchOn: 'Megnézés',

  // Language
  language: 'Nyelv',
  hungarian: 'Magyar',
  english: 'English',

  // Auth
  signIn: 'Bejelentkezés',
  signOut: 'Kijelentkezés',
  syncingWatchlist: 'Watchlist szinkronizálás...',

  // Favorites
  favorites: 'Kedvencek',
  like: 'Kedvelem',
  love: 'Imádom',
  liked: 'Kedvelt',
  loved: 'Imádott',
  noFavorites: 'Még nincsenek kedvenceid.',
  filterAll: 'Összes',

  // Movie Sections
  trending: 'Felkapott',
  nowPlaying: 'Most a mozikban',
  upcoming: 'Hamarosan',
  onTheAir: 'Most adásban',
  showFilters: 'Szűrők megjelenítése',
  hideFilters: 'Szűrők elrejtése',

  // Browse Mode
  browseMode: 'Lista típusa',
  browseStreaming: 'Streaming',
  browseTrending: 'Felkapott',
  browseTheaters: 'Mozikban',
  browseUpcoming: 'Hamarosan',

  // Cinema filters
  city: 'Város',
  allCities: 'Összes város',
  date: 'Dátum',
  allDates: 'Összes nap',
  today: 'Ma',
  tomorrow: 'Holnap',
};

export type TranslationKeys = keyof typeof hu;
