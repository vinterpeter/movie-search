# Film & Sorozat Kereső / Movie & TV Show Search

> **Verzió / Version: 1.1.0**
>
> **Weboldal / Website: https://vinterpeter.github.io/movie-search/**

Többnyelvű (magyar/angol) webalkalmazás filmek és sorozatok kereséséhez, kívánságlista kezeléssel és streaming elérhetőség ellenőrzéssel.

Multilingual (Hungarian/English) web application for searching movies and TV shows, with watchlist management and streaming availability checking.

## Funkciók / Features

- **Többnyelvű támogatás / Multi-language support**: Magyar és angol nyelv (automatikus böngésző nyelvfelismerés)
- **Keresés / Search**: Filmek és sorozatok keresése a TMDB API-n keresztül
- **Film/Sorozat kapcsoló / Movie/TV toggle**: Váltás filmek és sorozatok között
- **Szűrők / Filters**: Kategória, év, értékelés, streaming szolgáltató és korhatár szűrők
- **Kívánságlista / Watchlist**: Filmek/sorozatok mentése helyi tárolásba
  - Megnézett jelölés / Watched marking
  - Automatikus elérhetőség ellenőrzés / Auto availability check
  - Egyedi frissítés gomb / Individual refresh button
- **Streaming elérhetőség / Streaming availability**: Magyar streaming szolgáltatók ellenőrzése
  - Netflix, HBO Max, Disney+, Amazon Prime, Apple TV+ támogatás
  - JustWatch integráció
- **Részletes modal / Details modal**: Film/sorozat részletek és előzetes
- **Reszponzív design / Responsive design**: Mobil és desktop nézet

## Technológiák

- React 18 + TypeScript
- Vite
- Lucide React (ikonok)
- CSS változók (dark téma)
- LocalStorage (kívánságlista perzisztencia)

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
│   ├── FilterPanel.tsx/.css     # Szűrő panel / Filter panel
│   ├── Header.tsx/.css          # Fejléc / Header
│   ├── LanguageSelector.tsx/.css # Nyelvválasztó / Language selector
│   ├── MovieCard.tsx/.css       # Film kártya / Movie card
│   ├── MovieGrid.tsx/.css       # Rácsos elrendezés / Grid layout
│   ├── MovieModal.tsx/.css      # Részletek modal / Details modal
│   └── Watchlist.tsx/.css       # Kívánságlista / Watchlist
├── hooks/
│   ├── useFilters.ts        # Szűrő hook / Filter hook
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
