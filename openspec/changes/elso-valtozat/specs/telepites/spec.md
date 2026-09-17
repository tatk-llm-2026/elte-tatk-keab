## Purpose

A kutetika egy paranccsal kerüljön a kutató saját projektjébe, és utána a kutató saját AI-asszisztenséből, beszélgetve legyen használható.

## ADDED Requirements

### Requirement: Telepítés egy paranccsal
A kutetika SHALL telepíthető legyen egy csomagkezelő-paranccsal, és egy inicializáló paranccsal SHALL a kutató projektjébe kerüljön. Az inicializálás SHALL a projektbe tegye a skilleket és a kar dokumentumait, és SHALL ne módosítson a projektben semmit a saját fájljain és az `AGENTS.md`-ben leírt bejegyzésen kívül.

#### Scenario: Első inicializálás
- **WHEN** a kutató a projektje mappájában lefuttatja az inicializáló parancsot
- **THEN** a skillek és a kar dokumentumai bekerülnek a projektbe, és az eszköz közérthetően elmondja, mit tett a projektbe és hogyan indítsa el az asszisztensben

#### Scenario: A kutató saját fájljai érintetlenek
- **WHEN** az inicializálás lefut egy olyan projektben, amelyben már vannak kutatási fájlok
- **THEN** a kutató meglévő fájljai nem változnak, kivéve az `AGENTS.md` kutetika-bejegyzését

### Requirement: Támogatott asszisztensek
A kutetika SHALL használható legyen Claude Code-ban, Codexben és GitHub Copilotban. Az inicializálás SHALL mindhárom asszisztens számára elérhetővé tegye a képességeket.

#### Scenario: Használat bármelyik asszisztensben
- **WHEN** a kutató az inicializálás után Claude Code-ban, Codexben vagy Copilotban azt írja: „kell nekem etikai engedély?"
- **THEN** az asszisztens a kutetika engedélyszükséglet-képességével válaszol

### Requirement: Szabályok az AGENTS.md-ben
Az inicializálás SHALL beírja a projekt `AGENTS.md`-jébe a kutatási adat védelmének szabályát (lásd `kutatasi-adat-vedelem`). Ha nincs `AGENTS.md`, SHALL létrehozza. A bejegyzés SHALL jól elkülönüljön a kutató saját szövegétől, hogy újratelepítéskor cserélhető legyen.

#### Scenario: Meglévő AGENTS.md
- **WHEN** a projektben már van `AGENTS.md` saját tartalommal
- **THEN** a kutetika-bejegyzés elkülönített blokkként hozzáadódik, a meglévő tartalom változatlan marad

#### Scenario: Újratelepítés
- **WHEN** a kutató egy újabb kutetika-verzióval újra inicializál
- **THEN** a kutetika-blokk és a csomag fájljai frissülnek, a blokk nem duplázódik, és a `keab/` mappa tartalma nem változik
