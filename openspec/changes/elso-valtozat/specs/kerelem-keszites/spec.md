## Purpose

Az eszköz a kutatóval beszélgetve helyben összegyűjti a kérelem tartalmát, és beadáskor ebből előállítja a kar hivatalos Word-űrlapjait és a mellékleteket magyarul vagy angolul, a döntéseket és a beadás tudnivalóit rögzítve.

## ADDED Requirements

### Requirement: A beadvány nyelve
Az eszköz SHALL a kérelem elkészítésének elején rákérdezzen, hogy a beadvány magyarul vagy angolul készüljön, és SHALL a választásnak megfelelő nyelvű kari űrlapokat használja. A beszélgetés nyelve SHALL független legyen a beadvány nyelvétől. A választás SHALL bekerüljön a `keab/dontesek.md`-be.

#### Scenario: Angol beadvány magyar beszélgetésben
- **WHEN** a kutató magyarul beszélget, és angol beadványt választ
- **THEN** az eszköz magyarul beszél tovább, a munkaanyag válaszai angolul készülnek, és előállításkor az angol nyelvű 7.1, 7.2 és 7.4 űrlapok készülnek el

### Requirement: Helyi munkaanyag
Az eszköz SHALL a kérelem teljes tartalmát a `keab/kerelem.md` munkaanyagban gyűjtse, űrlaponként és mezőnként. A munkaanyag SHALL a kutató számára olvasható és kézzel is javítható legyen. A munkaanyag SHALL csak a beadvány tartalmát tartalmazza; a döntések és indoklásuk a `dontesek.md`-be kerülnek. A kérelem tartalmán a kutató és az eszköz SHALL a munkaanyagban dolgozzon, nem a Word-fájlokban.

#### Scenario: Folyamatos gyűjtés
- **WHEN** a kutató a beszélgetés során megad egy adatot, például a résztvevők toborzásának módját
- **THEN** az adat a `keab/kerelem.md` megfelelő mezőjébe kerül, Word-fájl nem készül

#### Scenario: Kézi javítás
- **WHEN** a kutató a `keab/kerelem.md`-ben átír egy választ
- **THEN** az eszköz a következő lépésekben az átírt választ használja

### Requirement: Kikérdezés
Az eszköz SHALL előbb a projekt leírásából és a kutatási eszközökből töltsön ki a munkaanyagban mindent, amit lehet, és SHALL csak a hiányzó adatokat kérdezze meg. Olyan kérdésekre SHALL külön rákérdezzen, amelyekre a kutatók jellemzően nem gondolnak: kutatásvezető, intézményvezetői hozzájárulás, kiskorú résztvevők, adatfeldolgozó szolgáltatások (pl. AI-leiratkészítés).

#### Scenario: AI-leiratkészítés
- **WHEN** a projekt leírásából kiderül, hogy az interjúkat AI-szolgáltatás írja le
- **THEN** az eszköz rákérdez a szolgáltatásra, és felveszi a munkaanyag adatkezelési tervi részébe

#### Scenario: Intézményi helyszín
- **WHEN** a kutatás iskolában zajlik
- **THEN** az eszköz jelzi, hogy intézményvezetői hozzájárulás kell, és felveszi a mellékletek közé

### Requirement: A beadvány előállítása
A Word-fájlok SHALL csak a beadvány előállításakor készüljenek el, kérésre (pl. „állítsd elő a beadványt"). Az előállítás SHALL mindig egyben fusson le az alábbi lépésekkel, és egyik sem hagyható ki:
1. frissítésfigyelés (lásd `kari-dokumentumok`),
2. a Word-fájlok előállítása a munkaanyagból,
3. formai és ellenséges ellenőrzés a kész Word-fájlokon (lásd `ellenseges-ellenorzes`),
4. a figyelmeztetések és a kifogások bemutatása a kutatónak.

#### Scenario: Előállítás kérése
- **WHEN** a kutató kéri a beadvány előállítását
- **THEN** lefut a frissítésfigyelés, elkészülnek a Word-fájlok, lefut a formai és az ellenséges ellenőrzés, és a kutató megkapja a figyelmeztetéseket és a kifogáslistát

#### Scenario: Nincs Word ellenőrzés nélkül
- **WHEN** a Word-fájlok elkészülnek
- **THEN** az ellenőrzés is lefut, és nincs olyan út, amelyen ellenőrzés nélkül készül Word-fájl

#### Scenario: Hiányos munkaanyag
- **WHEN** a kutató előállítást kér, de a munkaanyagban kötelező mező üres
- **THEN** a Word-fájlok elkészülnek, a formai ellenőrzés kifogásként jelzi az üres mezőt, és az eszköz felajánlja a kitöltését

### Requirement: Az űrlapok kitöltése
Az előállítás SHALL a kar hivatalos Word-űrlapjait (7.1 Kutatásintegritási nyilatkozat, 7.2 Kutatásintegritási űrlap, 7.4 Adatkezelési terv) töltse ki, és SHALL elkészítse a tájékoztató és hozzájáruló nyilatkozatot. A kitöltött űrlapok SHALL megőrizzék a kari űrlap szerkezetét és formázását. A Bizottság által kitöltendő mezőket SHALL üresen hagyja.

#### Scenario: Kitöltött űrlap
- **WHEN** a beadvány előállítása lefutott
- **THEN** a `keab/` mappában elkészülnek a kitöltött `.docx` fájlok, és Wordben megnyitva a kari űrlappal azonos szerkezetűek

#### Scenario: Szószámkorlát
- **WHEN** az űrlap egy mezője szószámkorlátot ír elő
- **THEN** az eszköz már a munkaanyag írásakor a korláton belül tartja a szöveget, és a formai ellenőrzés jelzi, ha a kutató javítása túllépi

### Requirement: A Word kézi módosítása
Ha a kutató az előállítás után kézzel módosít egy Word-fájlt, az eszköz SHALL figyelmeztessen, hogy a módosítás a következő előállításkor elvész, és hogy a javítás helye a munkaanyag. Az eszköz SHALL ne akadályozza meg a kézi módosítást.

#### Scenario: Kézzel módosított Word
- **WHEN** a kutató előállítás után beleír a 7.2 Word-fájlba, majd újra előállítást kér
- **THEN** az eszköz előbb figyelmeztet, hogy a kézi módosítás felülíródik, és javasolja, hogy a javítást vigye át a munkaanyagba

### Requirement: Kimeneti mappa
Az eszköz SHALL minden kimenetet a projekt `keab/` mappájába tegyen: a `kerelem.md` munkaanyagot, a `dontesek.md`-t, és előállításkor a kitöltött űrlapokat a kari fájlnév-konvencióval (`VEZETEKNEV_DATUM`), a tájékoztató és hozzájáruló nyilatkozatot és a `bead.md`-t.

#### Scenario: A mappa tartalma előállítás után
- **WHEN** a beadvány előállítása lefutott
- **THEN** a `keab/` mappában megvan a `kerelem.md`, a `dontesek.md`, a 7.1, 7.2, 7.4 űrlap, a tájékoztató és hozzájáruló nyilatkozat és a `bead.md`

### Requirement: Döntések rögzítése
Az eszköz SHALL minden, a kérelmet érintő döntést rögzítsen a `keab/dontesek.md`-ben úgy, hogy látsszon, mit javasolt a gép és mit döntött a kutató.

#### Scenario: A kutató eltér a javaslattól
- **WHEN** az eszköz egy megoldást javasol, és a kutató mást választ
- **THEN** a `dontesek.md` tartalmazza a javaslatot és a kutató döntését is

### Requirement: Beadási tudnivalók
Az előállítás SHALL elkészítse a `keab/bead.md`-t: kinek, milyen címre, milyen formában és mikorra kell beküldeni, mely fájlokat kell csatolni, és hogy a beküldés a kutatásvezető feladata digitális aláírással. A `bead.md` SHALL rögzítse a kutetika verzióját, a felhasznált kari dokumentumok azonosítóját és az ellenőrzés eredményét.

#### Scenario: Beadási lista
- **WHEN** a beadvány előállítása lefutott
- **THEN** a `bead.md` felsorolja a címzettet, a csatolandó fájlokat, a kutetika verzióját, a felhasznált űrlapok azonosítóját és az ellenőrzés eredményét

### Requirement: Nem küldi el
Az eszköz SHALL ne küldje el a kérelmet, és SHALL ne állítsa, hogy az engedélyt biztosan megkapja.

#### Scenario: A kutató kéri a beküldést
- **WHEN** a kutató azt kéri, hogy az eszköz küldje el a kérelmet
- **THEN** az eszköz elmondja, hogy a beküldés a kutatásvezető feladata, és a `bead.md` alapján leírja a teendőket
