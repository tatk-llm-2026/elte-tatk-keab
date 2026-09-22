## Why

Az első éles tapasztalat egy valódi KEAB-értékelőlap volt (2026_007_01, „átdolgozásra, visszaküldésre javasolt”). Az eszköz bírálója a júniusi beadáson, az értékelőlap ismerete nélkül a bizottság hat kifogásából ötöt megtalált. Kettő hiányzott:
- az ELTE-s cím, ezt a bíráló nem vette észre;
- az átdolgozás menete: az eszköz csak új kérelmet tud végigvinni, azt nem, hogy „megjött a bírálat, javítsuk ki”. Ez gyakori helyzet, ráadásul a kutató ilyenkor a legbizonytalanabb.

## What Changes

- **Új: átdolgozás a bizottság értékelőlapja alapján.** A kutató odaadja az értékelőlapot, és az eszköz:
  - pontokra bontja a kifogásokat;
  - pontonként végigmegy rajtuk a kutatóval: mit kell a munkaanyagban javítani, milyen új melléklet kell, és mit nem tud vagy nem akar a kutató teljesíteni;
  - minden pont sorsát rögzíti;
  - az új beadáshoz pontonkénti válaszlevelet készít a bizottságnak.
- **Új: korábbi beadás beolvasása.** Ha a visszaküldött kérelem nem ezzel az eszközzel készült, az eszköz a beadott 7.1, 7.2 és 7.4 Word-fájlokból tölti fel a `keab/kerelem.md` munkaanyagot. Így az átdolgozás a meglévő szövegből indul.
- **Az előző beadás megőrzése.** A beadott változat és az értékelőlap a `keab/elozmeny/` alá kerül, és onnan nem íródik felül.
- **A bíráló átdolgozáskor megkapja az értékelőlapot és a válaszlevelet is.** Pontonként ellenőrzi, hogy a javított beadvány tényleg kezeli-e a bizottság kifogásait. A beszélgetést és a `dontesek.md`-t továbbra sem kapja meg.
- **ELTE-s cím.** A kérelem készítésekor az eszköz rákérdez a kutatásvezető ELTE-s e-mail címére. A gépi formai ellenőrzés kifogást ad, ha a 7.2 kutatásvezetői e-mail címe nem ELTE-s tartomány.

## Capabilities

### New Capabilities
- `atdolgozas`: a visszaküldött kérelem átdolgozása a bizottság értékelőlapja alapján. Kiterjed a korábbi beadás beolvasására, a pontonkénti feldolgozásra, a válaszlevélre és az előzmény megőrzésére.

### Modified Capabilities
- `ellenseges-ellenorzes`: a formai réteg ellenőrzi a kutatásvezető ELTE-s e-mail címét, a bíráló pedig átdolgozáskor a bizottsági pontok lefedését is vizsgálja.
- `kerelem-keszites`: a kikérdezés rákérdez a kutatásvezető ELTE-s e-mail címére.

Megjegyzés: ezek a képességek még az `elso-valtozat` változtatásban élnek, a fő `openspec/specs/` alatt nincsenek. Ez a változtatás ezért új követelményeket ad hozzájuk (ADDED). Az archiválás sorrendje: először az `elso-valtozat`, utána ez.

## Impact

- `skills/kutetika-kerelem/SKILL.md`: új átdolgozási szakasz, és az ELTE-s címre vonatkozó kérdés a kikérdezésben.
- `skills/kutetika-biralat/SKILL.md`: új kategória, a bizottsági pontok lefedése (csak átdolgozáskor).
- `src/ellenorzes.js`: ELTE-s e-mail-ellenőrzés a formai rétegben.
- Új segédprogram-parancsok (`src/parancsok.js`, új `src/atdolgozas.js`): az átdolgozás megkezdése, a korábbi beadás beolvasása és a pontok állapotának rögzítése.
- `src/biralat.js`: átdolgozáskor a bírálati csomagba kerül az értékelőlap és a válaszlevél.
- `src/eloallitas.js` és a `bead.md`: a válaszlevél a csatolandók közé kerül, és a `bead.md` feltünteti az előző eljárás azonosítóját.
- Tesztek: kitalált kutatás egy cég platformjával, egy kitalált értékelőlappal és egy Word-ből beolvasott korábbi beadással.
- Nem érinti: a 7.5-ös vizsgálati eljárást (továbbra is kívül esik), a kutatási adat védelmét (az értékelőlap és a beadott űrlapok nem kutatási adatok).
