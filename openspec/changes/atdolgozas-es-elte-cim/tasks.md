## 1. ELTE-s cím

- [x] 1.1 A mezőtérképben `ellenorzes: "elte-email"` jelölés a 7.2 kutatásvezetői e-mail mezőjén (magyar `[5]` és angol megfelelője); ellenőrzés: a mezőtérkép-tesztek zöldek, és a jelölés mindkét nyelven megvan
- [x] 1.2 Formai szabály az `src/ellenorzes.js`-ben: `elte.hu` vagy `*.elte.hu` tartomány, különben „javítandó” kifogás szabályzati hivatkozás nélkül; ellenőrzés: tesztek a `gmail.com`, `tatk.elte.hu`, `elte.hu`, `notelte.hu`, `elte.hu.example.com` címekre, a nagybetűs és a szóközös címre is
- [x] 1.3 A `kutetika-kerelem` skill kikérdezése kérje a kutatásvezető ELTE-s címét, és nem ELTE-s címnél jelezzen; ellenőrzés: a skill szövegében szerepel, a kitalált tesztkutatás gmailes címmel lefutva a kérdés elhangzik

## 2. Előzmény és az átdolgozás megkezdése

- [x] 2.1 `atdolgozas-kezd` parancs: az értékelőlap és a beadott fájlok a `keab/elozmeny/<dátum>/` alá, ujjlenyomattal a `.ellenorzes.json`-ban, és az `atdolgozas.md` váza; ellenőrzés: teszt, hogy létező előzménymappába nem ír, és hogy megadott fájlok nélkül az utolsó előállítást menti
- [x] 2.2 Az előállítás nem ír a `keab/elozmeny/` alá; ellenőrzés: teszt, hogy átdolgozás utáni újraelőállítás után az előzmény bájtra azonos
- [x] 2.3 Az `atdolgozas.md` beolvasója (pontok, állapot, érintett mezők, indoklás), olvasható hibaüzenettel felismerhetetlen szakasznál; ellenőrzés: teszt kézzel átírt fájllal és hibás állapotnévvel

## 3. Beolvasás Wordből

- [x] 3.1 `beolvas` parancs a cella- és a hozzáfűzéses mezőkre a mezőtérkép `hely` mezője alapján; ellenőrzés: a kari 7.2 és 7.4 űrlapon, kézzel kitöltött kitalált mintán minden cellaválasz egyezik
- [x] 3.2 Igen-nem mezők az aláhúzás alapján; bizonytalan esetben (nincs vagy kettő van) megjelölés; ellenőrzés: tesztek mindhárom esetre
- [x] 3.3 Eltérő ujjlenyomatú (régebbi) űrlap: mezőkeresés a kérdésszöveg alapján, a meg nem feleltethetők megjelölése; ellenőrzés: teszt egy kérdéssorral eltolt űrlapon
- [x] 3.4 A megjelölt mezőket a formai ellenőrzés jelzi, a `kerelem.md` beolvasója nem veszi válasznak; ellenőrzés: teszt
- [x] 3.5 A beolvasás egy menetben is fusson oda-vissza: beolvasás, majd előállítás; ellenőrzés: a cellaválaszok a kitöltött Wordben változatlanok

## 4. Átdolgozás a skillben

- [x] 4.1 A `kutetika-kerelem` SKILL.md új szakasza: felismerés, az értékelőlap elkérése, az `atdolgozas-kezd` és ha kell a `beolvas` futtatása, pontokra bontás, és a kutató szó szerinti összevetése az értékelőlappal; ellenőrzés: a skill leírásában ott vannak az átdolgozás kulcsszavai, és a szakasz lépései megegyeznek a spec forgatókönyveivel
- [x] 4.2 Pontonkénti feldolgozás: sorrend (a súlyosabbakkal kezdve), javaslat, javítás a munkaanyagban, az állapot és az indoklás rögzítése, `dontesek.md`; elutasított kérelemnél nem kezd átdolgozást, a titkársághoz irányít
- [x] 4.3 Válaszlevél: `keab/valaszlevel.md` a pontokból, a beadvány nyelvén; előállításkor Word a kari fájlnév-konvencióval, bekerül a csatolandók közé és a „mehet” pillanatképébe; ellenőrzés: teszt, hogy a válaszlevél módosítása érvényteleníti a „mehet”-et
- [x] 4.4 A nyitott pontok és a nem teljesíthető pontok hiányzó indoklása formai kifogás; ellenőrzés: teszt
- [x] 4.5 `bead.md` átdolgozáskor: az előző eljárás azonosítója, a válaszlevél a csatolandók között, és a visszaküldés módjáról a titkárságot kell kérdezni; ellenőrzés: teszt

## 5. Bírálat átdolgozáskor

- [x] 5.1 A bírálati csomag `bizottsag/` mappája (az értékelőlap és a válaszlevél szöveges másolata), csak átdolgozáskor; `dontesek.md` és `atdolgozas.md` nélkül; ellenőrzés: teszt a csomag fájllistájára mindkét módban
- [x] 5.2 A `kutetika-biralat` SKILL.md 7. kategóriája: bizottsági pontok lefedése, súlyos kifogás, ha a javítás csak a válaszlevélben van meg, és kötelező marad a teljes bírálat is
- [x] 5.3 A második AI-szolgáltatóhoz küldés engedélykérő szövege kiegészül az értékelőlappal; ellenőrzés: teszt a szövegre
- [x] 5.4 A bíráló szöveges másolatában a kijelölt IGEN/NEM „[kijelölve]”, az aláhúzás „[aláhúzva: …]” jelet kap (az ujjlenyomatot nem érinti); a 6.3 próbája mutatta meg, hogy enélkül a bíráló nem látja a választást; ellenőrzés: tesztek az eszközzel és kézzel kitöltött űrlapra, az üres kari űrlapokon nincs jel

## 6. Kipróbálás

- [x] 6.1 Kitalált tesztkutatás a GoSchool-eset mintájára: egy cég platformja, a hozzájárulás a szolgáltatási feltételekben, gmailes cím, PhD nélküli kutatásvezető, hiányzó kérdőív, „Nem” az érdekütközésre; hozzá kitalált értékelőlap. Valódi személyes adat és a valódi GoSchool-beadás nem kerülhet a repóba
- [x] 6.2 Az eredeti beadáson lefuttatva a bíráló megtalálja az érdekütközést, a hozzájárulás hibáit, a PhD-t és a hiányzó mellékletet, a formai réteg pedig az ELTE-s címet; ellenőrzés: a bírálat kifogáslistája
- [x] 6.3 Az átdolgozás végigvitele a kitalált értékelőlappal: egy pont szándékosan csak a válaszlevélben javítva, és egy javítás közben bekerült új ellentmondás; ellenőrzés: a bíráló mindkettőt jelzi

  Eredmény (2026-09-22, Claude subagent bíráló, `test/fixtures/atdolgozas-proba/`): az eredeti beadáson a bíráló megtalálta a PhD hiányát, a szerződési feltételekhez kötött hozzájárulást, a tájékoztató hiányait, az érdekütközést és a hiányzó mellékleteket; a gmailes címet a gépi réteg jelezte. Az átdolgozáson mindkét csapdát súlyosnak jelölte (a csak a válaszlevélben „mellékelt” kérdőívet és a 7.1-ben maradt régi kutatásvezetőt), és a javításból maradt új ellentmondásokat is jelezte (pl. a 7.2/[15] a [14]-gyel, a finanszírozás a 7.2/[10] és a [18] között). Tanulság: a Word-fájlok szöveges másolatából a bíráló nem látja, melyik IGEN/NEM van kijelölve (figyelmeztetésként jelezte).
- [ ] 6.4 Éles próba a GoSchool-kérelem átdolgozásával a `goschool/goschool` repóban; az „ELTE-s cím” jelentését és a visszaküldés módját a titkárságtól megkérdezni, és a választ a `design.md` nyitott kérdéseinél rögzíteni
