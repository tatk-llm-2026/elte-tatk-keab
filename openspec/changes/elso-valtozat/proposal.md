## Why

A TáTK kutatásetikai engedélykérelme (KEAB) nem bonyolult, de a kitöltése az: három Word-űrlap, egy hosszú szabályzat, és helyzettől függő mellékletek. A kutató jellemzően azon akad el, amire nem gondolt (ki lehet kutatásvezető, kell-e intézményvezetői hozzájárulás, bekerül-e az AI-szolgáltatás az adatkezelési tervbe), és ebből hiánypótlás lesz, ami havi ülésrendnél egy hónap csúszás. Most még semmi nincs meg az eszközből, ez az első változat.

## What Changes

- Új, egy paranccsal telepíthető eszköz (`kutetika`), amely a kutató saját projektjébe telepíti magát, és a kutató saját AI-asszisztensével (Claude Code, Codex, Copilot) használható, beszélgetve.
- **Kell-e engedély?** Az eszköz a projekt leírásából és kérdésekből eldönti, kell-e engedély, és ki lehet a kutatásvezető, a szabályzatra hivatkozva.
- **Kérelem elkészítése.** Kikérdezi a kutatót arról, ami a leírásból nem derül ki, és a kérelem tartalmát helyben, a projektben gyűjti egy olvasható, bármikor javítható munkaanyagban. Beadáskor ebből állítja elő a kar hivatalos Word-űrlapjait (7.1, 7.2, 7.4), valamint a tájékoztató és hozzájáruló nyilatkozatot. Magyar és angol beadvány is készülhet; a beszélgetés nyelve ettől teljesen független.
- **Ellenséges ellenőrzés.** Egy külön bíráló, aki nem látta a beszélgetést, a bizottság szemével keres hibát a beadványban. A Word-fájlok előállításakor mindig lefut a frissítésfigyeléssel és a formai ellenőrzéssel együtt; kérésre korábban is futtatható a munkaanyagon. „Mehet" csak lefutott ellenőrzés után adható, és csak a fájlok ellenőrzött állapotára érvényes.
- **A kar dokumentumai a csomagban vannak** (magyar és angol űrlapok, szabályzat). A kutetika verziója követi őket: ha a kar bármelyik nyelvű dokumentumot módosítja, új kutetika-verzió készül. Használatkor az eszköz megnézi a kar oldalát, és szól, ha frissíteni kell, vagy ha még nincs a módosításhoz illő verzió.
- **Alapelvek:** az eszköz figyelmeztet, de nem tilt; a döntés és a felelősség a kutatóé, és minden döntés rögzítésre kerül. A nyers kutatási adatot csak a kutató arra az alkalomra adott engedélyével olvassa. Nem küldi el a kérelmet, nem ad jogi tanácsot, nem garantálja az engedélyt, és a 7.5-ös vizsgálati eljárással nem foglalkozik.

## Capabilities

### New Capabilities
- `telepites`: az eszköz telepítése a kutató projektjébe, és az asszisztensnek szóló szabályok beírása a projekt `AGENTS.md`-jébe.
- `engedely-szukseglet`: annak eldöntése, kell-e engedély, és ki lehet a kutatásvezető.
- `kerelem-keszites`: a kutató kikérdezése, a Word-űrlapok és mellékletek kitöltése magyarul vagy angolul, a döntések és a beadási tudnivalók rögzítése.
- `ellenseges-ellenorzes`: a kész beadvány független, bizottsági szemmel végzett bírálata, és a „mehet" állapot kezelése.
- `kari-dokumentumok`: a kar dokumentumainak csomagolása, a verziózás, és a kar oldalán történt változások jelzése.
- `kutatasi-adat-vedelem`: a kutatási adat olvasásának szabályai.

### Modified Capabilities
<!-- Nincs: ez az első változat, még nincs meglévő specifikáció. -->

## Impact

- Új csomag az npm-en (`@arpadtamasi/elte-tatk-keab`), parancssori telepítővel.
- A kutató projektjében új mappák és fájlok: a skillek az asszisztensek helyén, a `keab/` kimeneti mappa, és jelölt bejegyzések az `AGENTS.md`-ben és az azt betöltő `CLAUDE.md`-ben.
- Külső függőség: a kar oldala (https://tatk.elte.hu/bizottsagok/kutetika), amelyet az eszköz használatkor lekérdez.
- A README több ponton ellentmond a döntéseknek (pl. „az eszköz nem tartalmazza az űrlapokat"), ezt a változtatás részeként javítani kell.
- Karbantartás: a kar dokumentumainak változásakor új kiadást kell készíteni.
