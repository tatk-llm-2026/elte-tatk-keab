## Purpose

A beadványt egy független bíráló a bizottság szemével átnézi, és megkeresi, miből lehetne hiánypótlás vagy elutasítás, mielőtt a kutató beküldi.

## ADDED Requirements

### Requirement: Független bíráló
Az ellenőrzést SHALL egy olyan bíráló végezze, amely nem látta a kérelem elkészítéséről szóló beszélgetést. A bíráló SHALL csak a beadvány anyagát (előállításkor a Word-fájlokat, korábbi kérésnél a `keab/kerelem.md`-t), a kari szabályzatot és a kari űrlapokat használja; a `dontesek.md`-t SHALL ne kapja meg. A bíráló SHALL a beadvány nyelvén bíráljon.

#### Scenario: Csak a kutató fejében teljes válasz
- **WHEN** egy űrlapmező válasza csak a beszélgetésben elhangzottakkal együtt érthető
- **THEN** a bíráló kifogásolja, mert a papírból nem derül ki

### Requirement: Mit keres a bíráló
Az ellenőrzés SHALL legalább ezeket vizsgálja: ellentmondás az űrlapok között (különösen a 7.2 és a 7.4 között), hiányzó melléklet, szabályzatnak nem megfelelő kutatásvezető, üres kötelező mező, szószámkorlát túllépése, olyan adatkezelés, amely nem szerepel az adatkezelési tervben. Ha a beadvány a kar oldalán elérhetőnél régebbi kari dokumentummal készül, SHALL ezt is kifogásként jelezze.

#### Scenario: Ellentmondás az űrlapok között
- **WHEN** a 7.2 szerint a kutatás hangfelvételt készít, de a 7.4 nem említ hangfelvételt
- **THEN** a bíráló kifogásként jelzi az ellentmondást, és megnevezi mindkét helyet

#### Scenario: Régi űrlap
- **WHEN** a beadvány olyan kari űrlappal készül, amelyet a kar azóta módosított
- **THEN** az ellenőrzés kifogásként jelzi, hogy a beadvány régebbi űrlappal készült

### Requirement: Kifogáslista
Az ellenőrzés SHALL kifogáslistát adjon, súlyosság szerint rendezve. Minden kifogás SHALL megnevezze a helyet, a problémát, és ha lehet, a szabályzat vonatkozó pontját. A hely SHALL a munkaanyag mezőjére is utaljon, mert a javítás ott történik.

#### Scenario: Kifogások bemutatása
- **WHEN** az ellenőrzés lefutott és talált problémát
- **THEN** a kutató súlyosság szerint rendezett listát kap, minden tételnél a problémával és a `kerelem.md` javítandó mezőjével

### Requirement: Mikor fut
Az ellenőrzés SHALL mindig lefusson a beadvány előállításakor (lásd `kerelem-keszites`), és SHALL kérésre korábban is lefuttatható legyen a munkaanyagon (pl. „nézd át, mielőtt elküldöm").

#### Scenario: Előállításkor
- **WHEN** az eszköz előállítja a Word-fájlokat
- **THEN** az ellenőrzés a kész Word-fájlokon magától lefut

#### Scenario: Kérésre, előállítás előtt
- **WHEN** a kutató Word-fájlok előállítása előtt azt írja: „nézd át"
- **THEN** az ellenőrzés a `keab/kerelem.md` aktuális állapotán lefut, Word-fájl nem készül, és „mehet" állapotot nem ad

### Requirement: Mehet állapot
Az eszköz SHALL csak akkor adja a „mehet" állapotot, ha az ellenőrzés a beadvány előállításakor lefutott. A „mehet" SHALL a munkaanyag és a Word-fájlok pontosan azon állapotára vonatkozzon, amelyet az ellenőrzés látott. Ha ezután a munkaanyag vagy bármelyik beadandó fájl módosul, a „mehet" SHALL elvesszen, és új előállítás kell.

#### Scenario: Nincs kifogás
- **WHEN** az előállításkori ellenőrzés nem talált kifogást
- **THEN** az eszköz „mehet" állapotot ad, és ezt rögzíti a `bead.md`-ben

#### Scenario: Módosítás az ellenőrzés után
- **WHEN** a kutató „mehet" után módosítja a munkaanyagot vagy egy Word-fájlt
- **THEN** az eszköz jelzi, hogy a „mehet" már nem érvényes, és új előállítást kér

#### Scenario: Nincs előállítás
- **WHEN** a kutató „mehet"-et kér, de a beadvány még nem lett előállítva
- **THEN** az eszköz nem ad „mehet"-et, hanem felajánlja az előállítást

### Requirement: A kutató felülbírálhatja a kifogásokat
Az eszköz SHALL figyelmeztessen a megmaradt kifogásokra, de SHALL ne akadályozza meg, hogy a kutató továbblépjen. Ha a kutató kifogás mellett dönt a továbblépésről, az eszköz SHALL ezt rögzítse a `dontesek.md`-ben, és a `bead.md`-ben a „mehet" SHALL tüntesse fel a felülbírált kifogásokat.

#### Scenario: Felülbírált kifogás
- **WHEN** az előállításkori ellenőrzés után marad egy kifogás, és a kutató úgy dönt, hogy így is beadja
- **THEN** az eszköz figyelmeztet, rögzíti a döntést a `dontesek.md`-ben, és „mehet" állapotot ad a felülbírált kifogás feltüntetésével
