## Purpose

Ha a bizottság a kérelmet átdolgozásra visszaküldi, az eszköz a kutatóval pontonként végigmegy az értékelőlapon, kijavítja a munkaanyagot, és az új beadáshoz válaszlevelet készít. Közben megőrzi az előző beadást.

## ADDED Requirements

### Requirement: Az átdolgozás indítása
Az eszköz SHALL felismerje, ha a kutató a bizottság értékelőlapjával vagy annak hírével jön (pl. „visszaküldték”, „megjött a bírálat”, „átdolgozásra javasolt”), és SHALL ajánlja fel az átdolgozást. Az értékelőlapot SHALL a kutatótól kérje, fájlként vagy bemásolt szövegként. Az eszköz SHALL ne keresse és ne olvassa a kutató levelezését.

#### Scenario: A kutató jelzi, hogy visszaküldték
- **WHEN** a kutató azt írja, hogy a bizottság átdolgozásra visszaküldte a kérelmét
- **THEN** az eszköz felajánlja az átdolgozást, és elkéri az értékelőlapot

#### Scenario: Elutasított kérelem
- **WHEN** az értékelőlap szerint a bizottság a kérelmet elutasította, és nem átdolgozásra küldte vissza
- **THEN** az eszköz ezt közérthetően megmondja, a szabályzatra hivatkozva elmondja a lehetőségeket, és a KEAB titkárságához irányít; átdolgozást csak akkor kezd, ha a kutató új kérelmet akar beadni

### Requirement: Az előző beadás megőrzése
Az átdolgozás megkezdésekor az eszköz SHALL a korábban beadott fájlokat és az értékelőlapot a `keab/elozmeny/<beadás dátuma>/` mappába tegye. Ennek a mappának a tartalmát SHALL ne módosítsa és ne írja felül. Ha a kutató nem adja meg a beadott fájlokat, az eszköz SHALL a `keab/` mappában lévő utolsó előállítást tekintse beadottnak, és ezt SHALL megmondja a kutatónak.

#### Scenario: Előzmény rögzítése
- **WHEN** a kutató megadja az értékelőlapot, és a kérelmet ezzel az eszközzel készítette
- **THEN** a legutóbb előállított űrlapok, a `kerelem.md` akkori állapota és az értékelőlap a `keab/elozmeny/` alá kerülnek, és az átdolgozás a munkaanyag másolatán folytatódik

#### Scenario: Újraelőállítás után
- **WHEN** az átdolgozott beadvány előállítása felülírja a `keab/` mappa Word-fájljait
- **THEN** a `keab/elozmeny/` alatti korábbi változat változatlan marad

### Requirement: Korábbi beadás beolvasása
Ha a visszaküldött kérelem nem ezzel az eszközzel készült, és nincs `keab/kerelem.md`, az eszköz SHALL a beadott 7.1, 7.2 és 7.4 Word-fájlokból töltse fel a munkaanyagot, mezőnként. Azokat a mezőket, amelyeket nem tudott egyértelműen beolvasni, SHALL a munkaanyagban megjelölje, és SHALL megnevezze a kutatónak. A beadott mellékleteket (pl. tájékoztató, kérdőív) SHALL a mellékletek közé vegye fel.

#### Scenario: Máshogy készült kérelem
- **WHEN** a kutató a kar űrlapján, kézzel kitöltött 7.2 és 7.4 Word-fájlt ad meg
- **THEN** a `keab/kerelem.md` a beadott válaszokkal töltődik fel, és az eszköz felsorolja azokat a mezőket, amelyeket ellenőrizni kell

#### Scenario: Régebbi kari űrlap
- **WHEN** a beadott Word-fájl a kar egy korábbi űrlapváltozatán készült
- **THEN** az eszköz a válaszokat az aktuális űrlap mezőibe tölti, a meg nem feleltethető válaszokat megjelöli, és a döntést rögzíti a `dontesek.md`-ben

### Requirement: Az értékelőlap pontokra bontása
Az eszköz SHALL az értékelőlapot önálló bizottsági pontokra bontsa. Minden pontnál SHALL rögzítse a bizottság szövegét szó szerint, azt, hogy a munkaanyag mely mezőit vagy mely mellékleteket érinti, és a pont állapotát. A pontokat a `keab/atdolgozas.md` SHALL tartalmazza, a kutató számára olvashatóan. Ha az értékelőlap egy pontja több kérést tartalmaz (pl. felsorolásban), azokat SHALL külön pontként kezelje.

#### Scenario: Felsorolásos kérés
- **WHEN** az értékelőlap egy pontja három külön pótlást sorol fel
- **THEN** az `atdolgozas.md`-ben három külön pont szerepel, mindegyiknél a bizottság szövegével és az érintett mezőkkel

#### Scenario: Nem értelmezhető pont
- **WHEN** egy bizottsági kérés többféleképpen érthető (pl. „ELTE-s cím megadása szükséges”)
- **THEN** az eszköz felsorolja a lehetséges értelmezéseket, a kutatót kérdezi, és ha a kutató sem biztos, a KEAB titkárságához irányítja; a döntés a `dontesek.md`-be kerül

### Requirement: Pontonkénti feldolgozás
Az eszköz SHALL pontonként menjen végig a kutatóval a bizottsági pontokon, a súlyosabbakkal kezdve (pl. kutatásvezető, hozzájárulás). Minden pontnál SHALL javasoljon javítást a munkaanyagban vagy új mellékletet, és a kutató döntése után SHALL a javítást a munkaanyagban végezze el. Egy pont állapota SHALL legyen: nyitott, javítva vagy nem teljesíthető. Javítottnál SHALL megnevezze a módosított mezőket, nem teljesíthetőnél a kutató indoklását. Az eszköz SHALL ne vitassa a bizottság döntését a kutató helyett, és SHALL ne állítsa, hogy egy pont teljesítése után az engedély biztos.

#### Scenario: Javított pont
- **WHEN** a bizottság hiányolja a kérdőívet, és a kutató megadja a kérdőív fájlját
- **THEN** a kérdőív a mellékletek közé kerül, a 7.2 megfelelő mezője hivatkozik rá, és a pont állapota „javítva” lesz a módosított helyek megnevezésével

#### Scenario: A kutató nem teljesíti a kérést
- **WHEN** a kutató egy bizottsági kérést nem tud vagy nem akar teljesíteni
- **THEN** az eszköz elmondja a várható következményt, a kutató indoklását rögzíti a pontnál és a `dontesek.md`-ben, és a pont állapota „nem teljesíthető” lesz

#### Scenario: Kutatásvezetőt kell cserélni
- **WHEN** a bizottság kifogása, hogy a kutatásvezetőnek nincs PhD-fokozata
- **THEN** az eszköz a szabályzat definíciójára hivatkozva elmondja a lehetőségeket (pl. témavezető mint kutatásvezető), a kutató döntése szerint átírja az érintett mezőket mindhárom űrlapon, és jelzi, hogy a beküldés az új kutatásvezető feladata

### Requirement: Válaszlevél a bizottságnak
Az átdolgozott beadvány előállításakor az eszköz SHALL elkészítse a `keab/valaszlevel.md`-t és annak Word-változatát a beadvány nyelvén. A levél pontonként SHALL felsorolja a bizottsági kéréseket és azt, hogy mi változott és hol (űrlap és kérdés), a nem teljesíthető pontoknál a kutató indoklásával. A levél SHALL hivatkozzon az előző eljárás azonosítójára, ha az értékelőlapon szerepel. A válaszlevél SHALL a csatolandó fájlok közé kerüljön.

#### Scenario: Minden pont javítva
- **WHEN** minden bizottsági pont állapota „javítva”, és a kutató előállítást kér
- **THEN** elkészül a válaszlevél, pontonként a bizottsági kéréssel és a módosított helyekkel, és a `bead.md` csatolandói között szerepel

#### Scenario: Nyitott pont maradt
- **WHEN** a kutató előállítást kér, de van nyitott bizottsági pont
- **THEN** az eszköz megnevezi a nyitott pontokat, az előállítás lefut, a formai ellenőrzés kifogásként jelzi őket, és a válaszlevélben a pont „nyitott” jelöléssel szerepel

### Requirement: Beadási tudnivalók átdolgozáskor
Átdolgozott beadványnál a `keab/bead.md` SHALL tartalmazza, hogy ez az előző eljárás átdolgozása, az előző eljárás azonosítóját, és hogy a válaszlevelet is csatolni kell. Ha az értékelőlapról kiderül, kinek vagy milyen címre kell visszaküldeni, SHALL azt használja; különben a kar általános beadási címét, azzal, hogy a kutató kérdezzen rá a titkárságnál.

#### Scenario: Beadási lista átdolgozáskor
- **WHEN** az átdolgozott beadvány előállítása lefutott
- **THEN** a `bead.md` megnevezi az előző eljárás azonosítóját, és a csatolandók között szerepel a válaszlevél
