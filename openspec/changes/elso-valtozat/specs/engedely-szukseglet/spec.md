## Purpose

A kutató beszélgetésben megtudja, kell-e kutatásetikai engedély a kutatásához, és ki lehet a kérelem kutatásvezetője, a kari szabályzatra hivatkozva.

## ADDED Requirements

### Requirement: Döntés az engedély szükségességéről
Az eszköz SHALL a projekt leírásából és a kutatónak feltett kérdésekből megállapítsa, kell-e engedély. Az eredmény SHALL három érték egyike legyen: kell, nem kell, vagy határeset. Minden eredménynél SHALL megnevezze a szabályzat vonatkozó pontját.

#### Scenario: Egyértelmű eset
- **WHEN** a kutató megkérdezi, kell-e engedély, és a kutatás személyes adatot gyűjt résztvevőktől
- **THEN** az eszköz azt mondja, hogy kell engedély, és megnevezi a szabályzat vonatkozó pontját

#### Scenario: Határeset
- **WHEN** a kutatás mentesülhet (pl. anonimizált adatok másodelemzése), de a projekt leírásából nem dönthető el, hogy az adat a gyűjtéskor is anonim volt-e
- **THEN** az eszköz határesetként jelzi, felteszi a döntő kérdést, és nem dönt a kutató helyett

### Requirement: Csak azt kérdezi, ami nem derül ki
Az eszköz SHALL előbb a projekt leírásából és a kutatási eszközökből gyűjtsön információt, és SHALL csak azt kérdezze meg, ami ezekből nem derül ki.

#### Scenario: A leírásban benne van a válasz
- **WHEN** a projekt leírásában szerepel, hogy a résztvevők felnőttek
- **THEN** az eszköz nem kérdez rá a résztvevők életkorára

### Requirement: Kutatásvezető ellenőrzése
Az eszköz SHALL ellenőrizze, hogy a megnevezett kutatásvezető megfelel-e a szabályzat feltételeinek (tudományos fokozat), és SHALL figyelmeztessen, ha nem.

#### Scenario: Doktorandusz a kutatásvezető
- **WHEN** a kutató doktoranduszként saját magát nevezi meg kutatásvezetőnek
- **THEN** az eszköz figyelmeztet, hogy doktorandusz nem lehet kutatásvezető, és javasolja, hogy a témavezető vagy más fokozattal rendelkező kutató legyen az

### Requirement: Rögzítés
Az eszköz SHALL a döntést, az indoklását és a kutató válaszait rögzítse a `keab/dontesek.md`-ben.

#### Scenario: Döntés rögzítése
- **WHEN** az engedélyszükséglet eldőlt
- **THEN** a `keab/dontesek.md` tartalmazza az eredményt, a szabályzati hivatkozást, és hogy mit javasolt a gép és mit döntött a kutató

### Requirement: Határok
Az eszköz SHALL ne adjon jogi tanácsot. Jogalap és hasonló kérdésekben SHALL a lehetőségeket sorolja fel, és megnevezze, kihez kell fordulni. Ha a kutató már futó vagy lezárt kutatás etikai problémáját akarja bejelenteni (7.5-ös vizsgálati eljárás), SHALL jelezze, hogy ezzel az eszköz nem foglalkozik.

#### Scenario: Vizsgálati eljárás
- **WHEN** a kutató egy már lezárt kutatás etikai vétségét akarja bejelenteni
- **THEN** az eszköz közli, hogy ez a 7.5-ös vizsgálati eljárás, amellyel nem foglalkozik, és megmondja, hol találja az űrlapot
