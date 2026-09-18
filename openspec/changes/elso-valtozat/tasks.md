## 1. Előkészítés

- [ ] 1.1 Ellenőrizni Claude Code-ban, Codexben és Copilotban, hogy a projektbe tett skillek betöltődnek-e, melyik támogat tiszta kontextusú subagentet, és melyik asszisztensből melyik másik indítható parancssoron nem interaktív módban; az eredményt a `design.md` 3. és 7. döntéséhez feljegyezni
- [x] 1.2 Létrehozni a csomag vázát (`package.json`, parancssori belépési pont, tesztkeret), és ellenőrizni, hogy a `npx kutetika --help` helyben lefut
- [x] 1.3 Az npm-név kiválasztása: `@arpadtamasi/elte-tatk-keab` (szabad, 2026-09-18); a korábban lefoglalt `kutetika` névről a kiadáskor kell dönteni (elavultnak jelölés vagy meghagyás)

## 2. Kari dokumentumok

- [x] 2.1 Letöltő szkript a kar oldaláról a hat űrlaphoz (7.1, 7.2, 7.4 magyarul és angolul) és a két szabályzathoz; ellenőrzés: mind a nyolc fájl letöltődik a `dokumentumok/` mappába
- [x] 2.2 Szöveges ujjlenyomat-számítás normalizált szövegből; ellenőrzés: teszt, hogy ugyanaz a tartalom újramentve azonos, egy szó módosításával eltérő ujjlenyomatot ad
- [x] 2.3 `jegyzek.json` előállítása (verzió, forráscím, ujjlenyomat), és az ujjlenyomatok beírása a `package.json`-ba; ellenőrzés: teszt a jegyzék tartalmára
- [x] 2.4 A szabályzatok szövegének kinyerése fejezetekre bontva, magyarul és angolul; ellenőrzés: a fejezetszámok és -címek egyeznek a PDF tartalomjegyzékével

## 3. Munkaanyag és Word-előállítás

- [x] 3.1 Mezőtérkép a magyar 7.2 űrlaphoz (mezők, hely, kérdés, szószámkorlát, bizottsági mező); ellenőrzés: teszt, hogy minden kérdéssor pontosan egy mezőhöz tartozik
- [x] 3.2 A `kerelem.md` üres vázának előállítása a mezőtérképből, és a kitöltött munkaanyag beolvasása a fejezetcímek alapján; ellenőrzés: teszt, hogy a váz minden mezőt tartalmaz, a beolvasás kézzel átírt válasszal is helyes, és felismerhetetlen címnél megnevezi a mezőt
- [ ] 3.3 Beíró a `kerelem.md` és a mezőtérkép alapján (`src/kitoltes.js`); ellenőrzés: a kitöltött magyar 7.2 Wordben megnyitva hibaüzenet nélkül nyílik — a gépi rész tesztelt, a Wordben való megnyitást a kutatónak kell ellenőriznie
- [x] 3.4 A beíró megtagadja az írást eltérő ujjlenyomatú űrlapra; ellenőrzés: teszt módosított űrlappal
- [x] 3.5 Mezőtérképek a többi öt űrlaphoz (magyar 7.1, 7.4; angol 7.1, 7.2, 7.4); ellenőrzés: mindegyikre lefut a 3.1, 3.2 és 3.3 tesztje
- [x] 3.6 A Word-fájlok ujjlenyomatának feljegyzése előállításkor (`s.generalt`), és figyelmeztetés újraelőállítás előtt, ha egy Word-fájl kézzel módosult (`feluliras-megerositest-ker`); ellenőrzés: teszt kézzel módosított fájllal
- [x] 3.7 Fájlnevek a kari konvenció szerint (`VEZETEKNEV_DATUM`); ellenőrzés: teszt ékezetes vezetéknévvel

## 4. Telepítés

- [x] 4.1 `init` parancs: skillek a három asszisztens helyére, `.kutetika/` a dokumentumokkal és mezőtérképekkel; ellenőrzés: teszt egy üres és egy meglévő fájlokat tartalmazó projekten, a meglévő fájlok változatlanok
- [x] 4.2 AGENTS.md-blokk és a CLAUDE.md-ben jelölt @AGENTS.md-betöltés, létrehozással vagy hozzáfűzéssel; ellenőrzés: tesztek meglévő fájlokkal és nélkülük, kétszeri telepítéssel, Windows-sorvégekkel; a saját tartalom változatlan
- [x] 4.3 Újratelepítés: a blokk és a csomag fájljai frissülnek, a blokk nem duplázódik, a `keab/` érintetlen; ellenőrzés: teszt kétszeri inicializálással
- [ ] 4.4 Közérthető záróüzenet az `init` végén (`zaroUzenet`); ellenőrzés: egy nem fejlesztő tesztelő el tudja indítani a használatot az üzenet alapján — ehhez a kutatói visszajelzés kell

## 5. Frissítésfigyelés

- [x] 5.1 A kar oldalának letöltése, a nyolc link megkeresése és az ujjlenyomatok összevetése a jegyzékkel; ellenőrzés: teszt mentett oldallal egyező és eltérő dokumentummal
- [x] 5.2 Illő verzió keresése az npm-en a `package.json`-ban tárolt ujjlenyomatok alapján; ellenőrzés: teszt mintaverziólistával mindhárom esetre (egyezik, van új verzió, nincs még verzió)
- [x] 5.3 Hibakezelés (nincs internet, a link nem található) és egynapos gyorsítótár; ellenőrzés: teszt hálózat nélkül, és teszt, hogy a második hívás egy napon belül nem tölt le
- [x] 5.4 Heti automatikus karbantartói figyelés a GitHubon, eltérésnél hibajeggyel (`.github/workflows/figyeles.yml` + `scripts/figyeles.js`, mockolt hibajeggyel tesztelve); ellenőrzés: a valódi GitHub-hibajegy-nyitás először feltöltés után fut — kézi indítás ellenőrzése még hátravan

## 6. Adatvédelmi szabály

- [x] 6.1 Az adatolvasási szabály szövege az AGENTS.md-blokkba és mindhárom skillbe; ellenőrzés: mintaprojektben az asszisztens a `data/` fájl olvasása előtt engedélyt kér, megnevezi a fájlt és az okot, és elutasításnál nem olvas (a szöveg helye: `src/telepites.js` agentsBlokk és a három SKILL.md; a mintaprojektes ellenőrzés a 10.1 feladat)
- [x] 6.2 Az engedélyek rögzítésének szabálya a `dontesek.md`-ben, és figyelmeztetés személyes adatnál: mindhárom skillben előírva; a rögzítés gépi oldala a `munkafolyamat.js` napló; ellenőrzés: mintaprojekten (10.1)

## 7. Skill: kell-e engedély?

- [x] 7.1 A `kutetika-engedely` skill megírása angolul, a szabályzat szöveges változatára hivatkozva (kell / nem kell / határeset, kutatásvezető-ellenőrzés, 7.5 és jogi tanács határai); ellenőrzés: a mintaprojekteken a várt eredmény és a helyes szabályzati hivatkozás (10.1)
- [x] 7.2 A döntés rögzítése a `keab/dontesek.md`-ben (gépi javaslat és kutatói döntés): a skill ezt írja elő; ellenőrzés: a mintaprojekten a fájl tartalma (10.1)

## 8. Skill: kérelem elkészítése

- [x] 8.1 A beadvány nyelvének megkérdezése és rögzítése, a beszélgetés nyelvétől függetlenül: a munkaanyag `kutetika-kerelem nyelv=` jelölése és a skill előírása; ellenőrzés: magyar beszélgetésben angol beadvány készül (10.1)
- [x] 8.2 Kikérdezés: előbb a leírásból és a kutatási eszközökből, csak a hiányzót kérdezve, a jellemzően kifelejtett pontokkal (kutatásvezető, intézményvezetői hozzájárulás, kiskorúak, AI-leiratkészítés): a `kutetika-kerelem` skill előírása; ellenőrzés: a mintaprojekteken (10.1)
- [x] 8.3 A `kutetika-kerelem` skill angolul: a `kerelem.md` folyamatos vezetése a beszélgetés közben a beadvány nyelvén, szószámkorlát betartásával, Word-fájl nélkül; ellenőrzés: a mintaprojekten a beszélgetés végén a munkaanyag teljes, és a `keab/`-ben nincs Word-fájl (10.1)
- [x] 8.4 Előállító parancs (`eloallit` a `src/eloallitas.js`-ban és a CLI-n), amely egyetlen lépésben futtatja a frissítésfigyelést, a Word-előállítást, a formai ellenőrzést és a bíráló indítását, a Word-előállítás külön nem hívható; ellenőrzés: teszt, hogy nincs út ellenőrzés nélküli Word-fájlhoz, és hiányos munkaanyagnál a Word elkészül, az üres mező kifogásként jelenik meg
- [x] 8.5 A tájékoztató és hozzájáruló nyilatkozat elkészítése a `draft.tajekoztato` szövegből (`tajekoztatoWord`); az önkéntesség, visszavonás, cél, adatok és kapcsolattartó elemeit a formai ellenőrzés hiányzó tájékoztatóként jelzi, a tartalmat a skill kikérdezi; ellenőrzés: Word érvényes, tartalom a skill/felhasználó felelőssége (10.1)
- [x] 8.6 A `bead.md` elkészítése előállításkor (`beadIr`): címzett, csatolandók, kutetika-verzió, dokumentum-azonosítók, ellenőrzés eredménye, beküldés a kutatásvezető feladata; ellenőrzés: a mintaprojekten minden elem szerepel (10.1)

## 9. Ellenséges ellenőrzés

- [x] 9.1 Formai ellenőrzés a segédprogramban (`src/ellenorzes.js` formaiEllenorzes: üres kötelező mező, szószám, mellékletek, régi űrlap); ellenőrzés: tesztek szándékosan hibás beadványokkal, minden hibatípust megtalál
- [x] 9.2 A `kutetika-biralat` skill angolul: előállításkor a Word-fájlokat, előtte a `kerelem.md`-t, a `dontesek.md`-t nem, a szabályzatot és az űrlapokat kapja (`src/biralat.js` csomagKeszit + SKILL.md), súlyosság szerint rendezett kifogáslistát ad; ellenőrzés: a 7.2–7.4 ellentmondás-felismerés a mintabeadványon (10.1)
- [x] 9.3 A bíráló kiválasztása a segédprogramban (`biralat.js` biraloValaszt: másik asszisztens a gépen, ha a kutató engedélyezte; különben subagent; különben új beszélgetés), az 1.1 eredménye szerint; ellenőrzés: tesztek mindhárom esetre; a mintaprojektes ellenőrzés (10.1)
- [ ] 9.7 Elkülönített futtató a másik asszisztenshez (`src/kulso.js`: Codex `codex exec --sandbox read-only --ignore-user-config`, Claude `claude -p --restricted`, szűkített környezet, a Word-fájlok szöveges másolata a csomagban, az azonosítókat a program adja, a modelltől csak a kifogáslistát fogadja el); a projektgazda jóváhagyta, hogy a Codex olvasási korlátja csak utasítás, ezt az engedélykérés kimondja; ellenőrzés: egységtesztek, és valódi Claude-bírálat a mintaprojekten lefutott (2026-09-18) — a valódi Codex-bírálat még hátravan, a fejlesztői gépen a Codex elérte a használati keretét
- [x] 9.4 Engedélykérés a másik asszisztens első használata előtt (második AI-szolgáltató, mi jut el hozzá), a válasz rögzítése a `dontesek.md`-ben és a `keab/.ellenorzes.json`-ban (`engedelyRogzit`, `ADATKOZLES`), ismételt kérdezés nélkül; ellenőrzés: engedélyezett és elutasított eset a mintaprojekten (10.1)
- [x] 9.5 Indítás előállításkor mindig (`eloallit` végén `biralatIndit`), és kérésre a munkaanyagon (`munkaanyag-biralat`); ellenőrzés: mindkét úton lefut, és a kérésre futtatott változat nem ad „mehet"-et (tesztelve)
- [x] 9.6 „Mehet" állapot a `keab/.ellenorzes.json` alapján (`allapotSzamit` bájtpillanatképpel), érvénytelenítés a munkaanyag vagy egy Word-fájl módosításakor, felülbírálás figyelmeztetéssel és rögzítéssel (`felulbiral`); ellenőrzés: tesztek (nincs kifogás, módosítás utána, nem volt előállítás, felülbírált kifogás)

## 10. Kipróbálás és kiadás

- [ ] 10.1 Mintaprojektek végigvitele mindhárom asszisztensben mindhárom képességgel; ellenőrzés: minden mintaprojekten elkészül a beadvány, és a „mehet" állapot elérhető
- [x] 10.2 A README javítása a döntésekhez (a dokumentumok a csomagban vannak, helyi munkaanyag és Word-előállítás, verziózás, ellenséges ellenőrzés, angol beadvány, telepítési parancs); ellenőrzés: a README nem mond ellent a specifikációknak
- [ ] 10.3 Kiadás az npm-en 1.0.0 verzióval; ellenőrzés: egy tiszta gépen a `npx @arpadtamasi/elte-tatk-keab@latest init` után a „kell nekem etikai engedély?" kérdésre a kutetika válaszol
