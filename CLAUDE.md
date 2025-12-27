# Claude Projekt Útmutató - Film & Sorozat Kereső

## Projekt Összefoglaló

Ez egy React + TypeScript alapú webalkalmazás filmek és sorozatok kereséséhez. Magyar nyelvű felülettel rendelkezik.

## Fontos Szabályok

### 1. Dokumentáció Frissítése
- **MINDIG** frissítsd a `README.md` fájlt minden változtatás után
- Add hozzá az új funkciókat a "Változásnapló" szekcióhoz
- Tartsd naprakészen a mappastruktúrát

### 2. Verziózás
- A projekt szemantikus verziózást használ (MAJOR.MINOR.PATCH)
- **MAJOR**: Visszafelé nem kompatibilis változások
- **MINOR**: Új funkciók, visszafelé kompatibilis
- **PATCH**: Hibajavítások
- A verzió a `package.json` `version` mezőjében található
- Minden release-nél növeld a megfelelő verziószámot

### 3. Kód Stílus
- TypeScript strict mód
- Funkcionális komponensek React hooks-szal
- CSS modulok vagy egyedi CSS fájlok komponensenként
- Magyar nyelvű UI szövegek
- Angol nyelvű kód és kommentek

### 4. API Kulcsok
- Az API kulcsok a kódban vannak (fejlesztési célra)
- Éles környezetben környezeti változókba kell helyezni

## Projekt Struktúra

```
movie-search/
├── src/
│   ├── api/           # API integrációk
│   ├── components/    # React komponensek
│   ├── hooks/         # Egyedi React hookok
│   ├── types/         # TypeScript típusok
│   ├── App.tsx        # Fő alkalmazás
│   └── index.css      # Globális stílusok
├── package.json
├── README.md          # Projekt dokumentáció (FRISSÍTENDŐ!)
└── CLAUDE.md          # Ez a fájl
```

## Gyakori Feladatok

### Új komponens hozzáadása
1. Hozd létre a `.tsx` és `.css` fájlokat a `components/` mappában
2. Exportáld a komponenst
3. Frissítsd a `README.md` mappastruktúráját

### Új funkció hozzáadása
1. Implementáld a funkciót
2. Teszteld alaposan
3. Frissítsd a `README.md` funkciók listáját
4. Add hozzá a változásnaplóhoz
5. Növeld a verziószámot

### Hibajavítás
1. Javítsd a hibát
2. Add hozzá a változásnaplóhoz
3. Növeld a PATCH verziószámot

## Jelenlegi Verzió

**v1.0.0** - Lásd `README.md` a részletekért
