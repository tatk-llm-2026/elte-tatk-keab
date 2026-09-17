## Purpose

A kutatási adat ne kerüljön az AI-szolgáltatóhoz a kutató tudta és engedélye nélkül, de ha a kérelemhez szükséges, az eszköz a kutató engedélyével betekinthessen.

## ADDED Requirements

### Requirement: Szabadon olvasható anyagok
Az eszköz SHALL szabadon olvashassa a projekt leírását és a kutatási eszközöket (kérdőív, interjúvázlat, tájékoztató, toborzó szöveg).

#### Scenario: Kérdőív olvasása
- **WHEN** a projektben van kérdőív, és a kérelemhez szükséges
- **THEN** az eszköz engedélykérés nélkül elolvassa

### Requirement: Nyers kutatási adat csak engedéllyel
Az eszköz SHALL alapból ne olvassa a nyers kutatási adatot (a `data/` mappát, válaszokat, felvételeket, leiratokat). Ha a kérelemhez szükséges, SHALL előbb megmondja, melyik fájlt nézné meg és miért, és hogy a tartalom az AI-szolgáltatóhoz kerül, és SHALL csak a kutató arra az alkalomra adott kifejezett engedélyével olvassa. Az engedély SHALL csak arra az alkalomra és fájlra szóljon. Az eszköz SHALL csak annyit olvasson, amennyi szükséges.

#### Scenario: Engedélykérés
- **WHEN** az adatkezelési tervhez tudni kell, milyen adatfajták vannak egy adatfájlban
- **THEN** az eszköz megnevezi a fájlt és az okot, jelzi, hogy a tartalom az AI-szolgáltatóhoz kerül, és csak a kutató igenje után olvas

#### Scenario: Elutasított engedély
- **WHEN** a kutató nem engedi az adat olvasását
- **THEN** az eszköz nem olvassa el, és kérdésekkel pótolja a hiányzó információt

#### Scenario: Csak a szükséges rész
- **WHEN** az eszköznek csak az adatfájl oszlopneveire van szüksége
- **THEN** csak az oszlopneveket olvassa, a válaszokat nem

### Requirement: Rögzítés és figyelmeztetés
Minden adatolvasási engedély SHALL bekerüljön a `keab/dontesek.md`-be. Ha az olvasott adat személyes adatot tartalmazhat, az eszköz SHALL figyelmeztessen, hogy az AI-szolgáltatóhoz kerülése maga is adatkezelés, amelynek szerepelnie kell az adatkezelési tervben.

#### Scenario: Személyes adat olvasása
- **WHEN** a kutató engedélyt ad egy interjúleirat olvasására
- **THEN** az eszköz rögzíti az engedélyt, és figyelmeztet, hogy ezt az adatkezelési tervben fel kell tüntetni

### Requirement: A szabály a projektben is
A szabály SHALL szerepeljen a kutató projektjének `AGENTS.md`-jében (lásd `telepites`), hogy az asszisztens a kutetikán kívüli munkában is ismerje.

#### Scenario: Szabály az AGENTS.md-ben
- **WHEN** az inicializálás lefutott
- **THEN** a projekt `AGENTS.md`-je tartalmazza az adatolvasás szabályát
