# Film & Sorozat Kereső

> **Verzió: 1.0.0**
>
> **Weboldal: https://vinterpeter.github.io/movie-search/**

Magyar nyelvű webalkalmazás filmek és sorozatok kereséséhez, kívánságlista kezeléssel és streaming elérhetőség ellenőrzéssel.

## Funkciók

- **Keresés**: Filmek és sorozatok keresése az OMDB API-n keresztül
- **Film/Sorozat kapcsoló**: Váltás filmek és sorozatok között
- **Kívánságlista**: Filmek/sorozatok mentése helyi tárolásba
  - Megnézett jelölés
  - Automatikus elérhetőség ellenőrzés új elemeknél
  - Egyedi frissítés gomb minden elemhez
- **Streaming elérhetőség**: Magyar streaming szolgáltatók ellenőrzése (Streaming Availability API)
  - Netflix, HBO Max, Disney+, Amazon Prime, Apple TV+ támogatás
  - Cachelés a gyorsabb betöltésért
- **Részletes modal**: Film/sorozat részletek megjelenítése
- **Reszponzív design**: Mobil és desktop nézet támogatás

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

## Mappastruktúra

```
src/
├── api/
│   ├── omdb.ts              # OMDB API integráció
│   └── streamingAvailability.ts  # Streaming API integráció
├── components/
│   ├── Header.tsx/.css      # Fejléc (kereső, kapcsolók)
│   ├── MovieCard.tsx/.css   # Film/sorozat kártya
│   ├── MovieGrid.tsx/.css   # Kártyák rácsos elrendezése
│   ├── MovieModal.tsx/.css  # Részletes nézet modal
│   └── Watchlist.tsx/.css   # Kívánságlista panel
├── hooks/
│   ├── useMovies.ts         # Film adatok kezelése
│   └── useWatchlist.ts      # Kívánságlista hook
├── types/
│   └── movie.ts             # TypeScript típusok
├── App.tsx                  # Fő alkalmazás komponens
├── App.css
└── index.css                # Globális stílusok
```

---

## Változásnapló

### v1.0.0 (2025-12)
- Kezdeti kiadás
- Film és sorozat keresés
- Kívánságlista funkció
- Streaming elérhetőség ellenőrzés
- Ikon láthatóság javítások
- Kompakt fejléc design

---

> **FONTOS**: Ez a dokumentáció mindig frissítendő a projekt változásaival együtt! Minden új funkció, javítás vagy módosítás után frissítsd ezt a fájlt és növeld a verziószámot a `package.json`-ban is.
