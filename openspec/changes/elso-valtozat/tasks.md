## 1. Előkészítés

- [ ] 1.1 Ellenőrizni Claude Code-ban, Codexben és Copilotban, hogy a projektbe tett skillek betöltődnek-e, és melyik támogat tiszta kontextusú segédágenst; az eredményt a `design.md` 3. és 7. döntéséhez feljegyezni
- [ ] 1.2 Létrehozni a csomag vázát (`package.json`, parancssori belépési pont, tesztkeret), és ellenőrizni, hogy a `npx kutetika --help` helyben lefut
- [ ] 1.3 Lefoglalni a `kutetika` nevet az npm-en egy üres előzetes kiadással, és ellenőrizni, hogy az `npm view kutetika` megtalálja

## 2. Kari dokumentumok

- [ ] 2.1 Letöltő szkript a kar oldaláról a hat űrlaphoz (7.1, 7.2, 7.4 magyarul és angolul) és a két szabályzathoz; ellenőrzés: mind a nyolc fájl letöltődik a `dokumentumok/` mappába
- [ ] 2.2 Szöveges ujjlenyomat-számítás normalizált szövegből; ellenőrzés: teszt, hogy ugyanaz a tartalom újramentve azonos, egy szó módosításával eltérő ujjlenyomatot ad
- [ ] 2.3 `jegyzek.json` előállítása (verzió, forráscím, ujjlenyomat), és az ujjlenyomatok beírása a `package.json`-ba; ellenőrzés: teszt a jegyzék tartalmára
- [ ] 2.4 A szabályzatok szövegének kinyerése fejezetekre bontva, magyarul és angolul; ellenőrzés: a fejezetszámok és -címek egyeznek a PDF tartalomjegyzékével

## 3. Munkaanyag és Word-előállítás

- [ ] 3.1 Mezőtérkép a magyar 7.2 űrlaphoz (mezők, hely, kérdés, szószámkorlát, bizottsági mező); ellenőrzés: teszt, hogy minden kérdéssor pontosan egy mezőhöz tartozik
- [ ] 3.2 A `kerelem.md` üres vázának előállítása a mezőtérképből, és a kitöltött munkaanyag beolvasása a fejezetcímek alapján; ellenőrzés: teszt, hogy a váz minden mezőt tartalmaz, a beolvasás kézzel átírt válasszal is helyes, és felismerhetetlen címnél megnevezi a mezőt
- [ ] 3.3 Beíró a `kerelem.md` és a mezőtérkép alapján; ellenőrzés: a kitöltött magyar 7.2 Wordben megnyitva hibaüzenet nélkül nyílik, a válaszok a helyükön vannak, a formázás a sablonéval azonos
- [ ] 3.4 A beíró megtagadja az írást eltérő ujjlenyomatú űrlapra; ellenőrzés: teszt módosított űrlappal
- [ ] 3.5 Mezőtérképek a többi öt űrlaphoz (magyar 7.1, 7.4; angol 7.1, 7.2, 7.4); ellenőrzés: mindegyikre lefut a 3.1, 3.2 és 3.3 tesztje
- [ ] 3.6 A Word-fájlok ujjlenyomatának feljegyzése előállításkor, és figyelmeztetés újraelőállítás előtt, ha egy Word-fájl kézzel módosult; ellenőrzés: teszt kézzel módosított fájllal
- [ ] 3.7 Fájlnevek a kari konvenció szerint (`VEZETEKNEV_DATUM`); ellenőrzés: teszt ékezetes vezetéknévvel

## 4. Telepítés

- [ ] 4.1 `init` parancs: skillek a három asszisztens helyére, `.kutetika/` a dokumentumokkal és mezőtérképekkel; ellenőrzés: teszt egy üres és egy meglévő fájlokat tartalmazó projekten, a meglévő fájlok változatlanok
- [ ] 4.2 AGENTS.md-blokk jelölők között, létrehozással vagy hozzáfűzéssel; ellenőrzés: teszt meglévő AGENTS.md-vel és anélkül, a saját tartalom változatlan
- [ ] 4.3 Újratelepítés: a blokk és a csomag fájljai frissülnek, a blokk nem duplázódik, a `keab/` érintetlen; ellenőrzés: teszt kétszeri inicializálással
- [ ] 4.4 Közérthető záróüzenet az `init` végén (mi került a projektbe, hogyan kell indítani); ellenőrzés: egy nem fejlesztő tesztelő el tudja indítani a használatot az üzenet alapján

## 5. Frissítésfigyelés

- [ ] 5.1 A kar oldalának letöltése, a nyolc link megkeresése és az ujjlenyomatok összevetése a jegyzékkel; ellenőrzés: teszt mentett oldallal egyező és eltérő dokumentummal
- [ ] 5.2 Illő verzió keresése az npm-en a `package.json`-ban tárolt ujjlenyomatok alapján; ellenőrzés: teszt mintaverziólistával mindhárom esetre (egyezik, van új verzió, nincs még verzió)
- [ ] 5.3 Hibakezelés (nincs internet, a link nem található) és egynapos gyorsítótár; ellenőrzés: teszt hálózat nélkül, és teszt, hogy a második hívás egy napon belül nem tölt le
- [ ] 5.4 Heti automatikus karbantartói figyelés a GitHubon, eltérésnél hibajeggyel; ellenőrzés: kézi indítás egy szándékosan eltérő jegyzékkel hibajegyet nyit

## 6. Adatvédelmi szabály

- [ ] 6.1 Az adatolvasási szabály szövege az AGENTS.md-blokkba és mindhárom skillbe; ellenőrzés: mintaprojektben az asszisztens a `data/` fájl olvasása előtt engedélyt kér, megnevezi a fájlt és az okot, és elutasításnál nem olvas
- [ ] 6.2 Az engedélyek rögzítése a `dontesek.md`-ben, és figyelmeztetés személyes adatnál; ellenőrzés: mintaprojekten az engedély bejegyzése megjelenik, és elhangzik a figyelmeztetés

## 7. Skill: kell-e engedély?

- [ ] 7.1 A `kutetika-engedely` skill megírása angolul, a szabályzat szöveges változatára hivatkozva (kell / nem kell / határeset, kutatásvezető-ellenőrzés, 7.5 és jogi tanács határai); ellenőrzés: a mintaprojekteken a várt eredmény és a helyes szabályzati hivatkozás
- [ ] 7.2 A döntés rögzítése a `keab/dontesek.md`-ben (gépi javaslat és kutatói döntés); ellenőrzés: a mintaprojekten a fájl tartalma

## 8. Skill: kérelem elkészítése

- [ ] 8.1 A beadvány nyelvének megkérdezése és rögzítése, a beszélgetés nyelvétől függetlenül; ellenőrzés: magyar beszélgetésben angol beadvány készül
- [ ] 8.2 Kikérdezés: előbb a leírásból és a kutatási eszközökből, csak a hiányzót kérdezve, a jellemzően kifelejtett pontokkal; ellenőrzés: az AI-leiratkészítéses mintaprojekten a szolgáltatás bekerül a munkaanyag 7.4-es részébe, az iskolain az intézményvezetői hozzájárulás a mellékletek közé
- [ ] 8.3 A `kutetika-kerelem` skill angolul: a `kerelem.md` folyamatos vezetése a beszélgetés közben a beadvány nyelvén, szószámkorlát betartásával, Word-fájl nélkül; ellenőrzés: a mintaprojekten a beszélgetés végén a munkaanyag teljes, és a `keab/`-ben nincs Word-fájl
- [ ] 8.4 Előállító parancs, amely egyetlen lépésben futtatja a frissítésfigyelést, a Word-előállítást, a formai ellenőrzést és a bíráló indítását, a Word-előállítás külön nem hívható; ellenőrzés: teszt, hogy nincs út ellenőrzés nélküli Word-fájlhoz, és hiányos munkaanyagnál a Word elkészül, az üres mező kifogásként jelenik meg
- [ ] 8.5 A tájékoztató és hozzájáruló nyilatkozat elkészítése; ellenőrzés: tartalmazza az önkéntességet, a visszavonás jogát, a célt, a kezelt adatokat és a kapcsolattartót
- [ ] 8.6 A `bead.md` elkészítése előállításkor (címzett, csatolandók, kutetika-verzió, dokumentum-azonosítók, ellenőrzés eredménye, beküldés a kutatásvezető feladata); ellenőrzés: a mintaprojekten minden elem szerepel

## 9. Ellenséges ellenőrzés

- [ ] 9.1 Formai ellenőrzés a segédprogramban (üres kötelező mező, szószám, mellékletek, régi űrlap); ellenőrzés: tesztek szándékosan hibás beadványokkal, minden hibatípust megtalál
- [ ] 9.2 A `kutetika-biralat` skill angolul: előállításkor a Word-fájlokat, előtte a `kerelem.md`-t, a `dontesek.md`-t nem, a szabályzatot és az űrlapokat kapja, súlyosság szerint rendezett kifogáslistát ad; ellenőrzés: egy 7.2–7.4 ellentmondást tartalmazó mintabeadványon megtalálja az ellentmondást mindkét hellyel
- [ ] 9.3 Tiszta kontextus: segédágens, ahol van; ahol nincs, az előállítás a formai ellenőrzés után megáll, és új beszélgetést kér a bírálathoz (az 1.1 eredménye szerint); ellenőrzés: a bíráló nem hivatkozik olyanra, ami csak a beszélgetésben hangzott el
- [ ] 9.4 Indítás előállításkor mindig, és kérésre a munkaanyagon; ellenőrzés: mindkét úton lefut, és a kérésre futtatott változat nem ad „mehet”-et
- [ ] 9.5 „Mehet" állapot a `keab/.ellenorzes.json` alapján, érvénytelenítés a munkaanyag vagy egy Word-fájl módosításakor, felülbírálás figyelmeztetéssel és rögzítéssel; ellenőrzés: tesztek (nincs kifogás, módosítás utána, nem volt előállítás, felülbírált kifogás)

## 10. Kipróbálás és kiadás

- [ ] 10.1 Mintaprojektek végigvitele mindhárom asszisztensben mindhárom képességgel; ellenőrzés: minden mintaprojekten elkészül a beadvány, és a „mehet" állapot elérhető
- [ ] 10.2 A README javítása a döntésekhez (a dokumentumok a csomagban vannak, helyi munkaanyag és Word-előállítás, verziózás, ellenséges ellenőrzés, angol beadvány, telepítési parancs); ellenőrzés: a README nem mond ellent a specifikációknak
- [ ] 10.3 Kiadás az npm-en 1.0.0 verzióval; ellenőrzés: egy tiszta gépen a `npx kutetika@latest init` után a „kell nekem etikai engedély?" kérdésre a kutetika válaszol
