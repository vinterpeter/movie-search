# Film & Sorozat Kereső / Movie & TV Show Search

> **Verzió / Version: 1.2.0**
>
> **Weboldal / Website: https://vinterpeter.github.io/movie-search/**

Többnyelvű (magyar/angol) webalkalmazás filmek és sorozatok kereséséhez, kívánságlista kezeléssel és streaming elérhetőség ellenőrzéssel.

Multilingual (Hungarian/English) web application for searching movies and TV shows, with watchlist management and streaming availability checking.

## Funkciók / Features

- **Többnyelvű támogatás / Multi-language support**: Magyar és angol nyelv (automatikus böngésző nyelvfelismerés)
- **Keresés / Search**: Filmek és sorozatok keresése a TMDB API-n keresztül
- **Film/Sorozat kapcsoló / Movie/TV toggle**: Váltás filmek és sorozatok között
- **Szűrők / Filters**: Kategória, év, értékelés, streaming szolgáltató és korhatár szűrők
- **Kívánságlista / Watchlist**: Filmek/sorozatok mentése
  - Megnézett jelölés / Watched marking
  - Automatikus elérhetőség ellenőrzés / Auto availability check
  - Firestore szinkronizálás / Firestore sync
- **Kedvencek / Favorites**: Like és Love funkció filmekhez/sorozatokhoz
  - Kedvelt (👍) és Imádott (❤️) jelölés
  - Kedvencek panel szűréssel
  - Firestore szinkronizálás / Firestore sync
- **Ajánlások / Recommendations**: Személyre szabott ajánlások a kedvencek alapján
- **Streaming elérhetőség / Streaming availability**: Magyar streaming szolgáltatók ellenőrzése
  - Netflix, HBO Max, Disney+, Amazon Prime, Apple TV+ támogatás
  - JustWatch integráció
- **Részletes modal / Details modal**: Film/sorozat részletek és előzetes
- **Reszponzív design / Responsive design**: Mobil és desktop nézet

## Technológiák

- React 18 + TypeScript
- Vite
- Firebase (Authentication + Firestore)
- Lucide React (ikonok)
- CSS változók (dark téma)

## API-k

- **OMDB API**: Film/sorozat adatok (cím, év, értékelés, leírás)
- **Streaming Availability API**: Magyar streaming elérhetőség

## Telepítés

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Mappastruktúra / Folder Structure

```
src/
├── api/
│   ├── config.ts            # API konfiguráció
│   └── tmdb.ts              # TMDB API integráció
├── components/
│   ├── Favorites.tsx/.css       # Kedvencek panel / Favorites panel
│   ├── FilterPanel.tsx/.css     # Szűrő panel / Filter panel
│   ├── Header.tsx/.css          # Fejléc / Header
│   ├── LanguageSelector.tsx/.css # Nyelvválasztó / Language selector
│   ├── MovieCard.tsx/.css       # Film kártya / Movie card
│   ├── MovieGrid.tsx/.css       # Rácsos elrendezés / Grid layout
│   ├── MovieModal.tsx/.css      # Részletek modal / Details modal
│   ├── RecommendationsSection.tsx # Ajánlások szekció
│   ├── UserMenu.tsx/.css        # Felhasználó menü / User menu
│   └── Watchlist.tsx/.css       # Kívánságlista / Watchlist
├── firebase/
│   ├── config.ts            # Firebase konfiguráció
│   ├── favoritesService.ts  # Kedvencek Firestore service
│   └── watchlistService.ts  # Watchlist Firestore service
├── hooks/
│   ├── useAuth.ts           # Firebase Auth hook
│   ├── useBlacklist.ts      # Blacklist hook (ajánlások elrejtése)
│   ├── useFavorites.ts      # Kedvencek hook / Favorites hook
│   ├── useFilters.ts        # Szűrő hook / Filter hook
│   ├── useRecommendations.ts # Ajánlások hook
│   └── useWatchlist.ts      # Kívánságlista hook / Watchlist hook
├── i18n/
│   ├── index.tsx            # I18n provider és hook
│   └── translations/
│       ├── hu.ts            # Magyar fordítások / Hungarian translations
│       └── en.ts            # Angol fordítások / English translations
├── types/
│   └── movie.ts             # TypeScript típusok / Types
├── App.tsx                  # Fő alkalmazás / Main app
├── App.css
└── index.css                # Globális stílusok / Global styles
```

---

## Változásnapló / Changelog

### v1.2.0 (2025-12)
- **Kedvencek rendszer / Favorites system**: Like és Love gombok filmekhez/sorozatokhoz
  - Firestore szinkronizálás bejelentkezett felhasználóknak
  - Kedvencek panel szűréssel (Összes/Kedvelt/Imádott)
- **Ajánlások / Recommendations**: "Neked" mód a kedvencek alapján
  - Hasonló filmek/sorozatok ajánlása
  - Blacklist funkció (nem kívánt ajánlások elrejtése)
- **UI fejlesztések / UI improvements**:
  - Mobil kereső toggle ikon
  - Szűrő panel toggle ikon a fejlécben
  - Média toggle javítások (magyar szöveg megjelenítés)
  - For You mód gomb állapot javítás

### v1.1.0 (2025-12)
- **Többnyelvű támogatás / Multi-language support**: Magyar és angol nyelv
  - Nyelvválasztó a fejlécben / Language selector in header
  - Automatikus böngésző nyelvfelismerés / Auto browser language detection
  - LocalStorage perzisztencia / LocalStorage persistence
- I18n rendszer React Context-tel / I18n system with React Context

### v1.0.0 (2025-12)
- Kezdeti kiadás / Initial release
- Film és sorozat keresés / Movie and TV search
- Kívánságlista funkció / Watchlist feature
- Streaming elérhetőség ellenőrzés / Streaming availability check
- Szűrők (kategória, év, értékelés, szolgáltató, korhatár)

---

> **FONTOS / IMPORTANT**: Ez a dokumentáció mindig frissítendő a projekt változásaival együtt! / This documentation should be updated with project changes!
