# Design

## Context

- Az eszköz ma egyirányú: beszélgetés → `keab/kerelem.md` → előállítás (Word, formai és ellenséges ellenőrzés) → `bead.md`. Az állapotot a segédprogram a `keab/.ellenorzes.json`-ban tartja, a döntések a `keab/dontesek.md`-be kerülnek.
- A mezőtérképek (`mezoterkepek/*.json`) minden mezőnél megadják a válasz helyét a Wordben (`hely`: táblázat, sor, cella). A magyar 7.2-ben 31 mező egyszerű cella, 8 igen-nem aláhúzással, 1 hozzáfűzéses cella.
- A formai réteg (`src/ellenorzes.js`, `formaiEllenorzes`) gépi, mindig ugyanazt adja. A tartalmi réteg a tiszta kontextusú bíráló (`skills/kutetika-biralat`), amely csomagot kap (`beadvany/`, `kari/`, `biralo/`).
- A valódi próba (GoSchool-kérelem, 2026-09-22) megmutatta, hogy a bíráló a júniusi beadáson magától megtalálta a bizottság hat kifogásából ötöt, az ELTE-s címet nem. A kérelem nem az eszközzel készült; a beadott fájlokat kézzel kellett a projektbe másolni (`keab/elozmeny/2026-06-beadas/`).

## Goals / Non-Goals

**Goals:**
- Az átdolgozás a meglévő munkamenetre épüljön: ugyanaz a `kerelem.md`, ugyanaz az előállítás, ugyanaz a „mehet”.
- A kutató mindig lássa, melyik bizottsági pont hol tart (`keab/atdolgozas.md`).
- A bíráló átdolgozáskor ellenőrizze, hogy a javítások valóban benne vannak a beadványban.
- Az ELTE-s cím hiánya ne csak a bizottságnál derüljön ki.

**Non-Goals:**
- A 7.5-ös vizsgálati eljárás és a fellebbezés.
- A levelezés olvasása. Az értékelőlapot a kutató adja oda.
- A bizottsággal való vita a kutató helyett, vagy annak megítélése, hogy egy kifogás jogos-e.
- Tetszőleges, nem kari űrlapon készült kérelem beolvasása.

## Decisions

### 1. Az átdolgozás a `kutetika-kerelem` skill része, nem új skill
Az átdolgozás ugyanazon a munkaanyagon dolgozik, és ugyanazzal az előállítással zárul. Egy külön skill megkettőzné a kikérdezés és az előállítás szabályait, és a kutatónak el kellene döntenie, melyiket hívja. A skill leírásába bekerülnek az átdolgozás kulcsszavai („visszaküldték”, „megjött a bírálat”, „értékelőlap”).
*Alternatíva:* külön `kutetika-atdolgozas` skill. Elvetve: a két skill ütközne ugyanazon a `kerelem.md`-n.

### 2. `keab/atdolgozas.md`: a pontok ember által olvasható listája
A skill írja, a segédprogram ellenőrzi. Felépítése:
- fejléc: az előző eljárás azonosítója, a döntés, az értékelőlap helye;
- minden ponthoz egy szakasz: sorszám, a bizottság szövege szó szerint, érintett mezők (`7.2/[5]` alakban, mint a kifogásoknál), állapot (`nyitott` | `javitva` | `nem-teljesitheto`), és javításnál a módosítás leírása, nem teljesíthetőnél a kutató indoklása.

A segédprogram az előállításkor beolvassa. A nyitott pontokat formai kifogásként adja („javítandó”), a hiányzó indoklást a nem teljesíthető pontnál szintén. A fájl azért markdown és nem JSON, mert a kutató is olvassa és javíthatja, ahogy a `kerelem.md`-t is.

### 3. Az előzmény: `keab/elozmeny/<dátum>/`, csak olvasható
Az új `atdolgozas-kezd` parancs három dolgot kap:
- az értékelőlap útvonalát;
- a beadás dátumát;
- a beadott fájlok listáját, vagy semmit, ha az utolsó előállítás a beadott változat.

A parancs ezeket a mappába másolja, ujjlenyomatot ír róluk a `.ellenorzes.json`-ba, és létrehozza az `atdolgozas.md` vázát. Ha a mappa már létezik, nem ír bele. Az előállítás pedig nem ír a `keab/elozmeny/` alá. Az értékelőlap általában szkennelt PDF. A pontokra bontást a skill végzi (az asszisztens olvassa a PDF-et), nem a segédprogram.

### 4. Beolvasás Wordből: a mezőtérkép visszafelé
Az új `beolvas` parancs a beadott 7.1, 7.2 és 7.4 Word-fájlokból a mezőtérkép `hely` mezője alapján kiolvassa a válaszokat, és megírja belőlük a `kerelem.md`-t:
- **Cellák:** a válaszcella szövege.
- **Igen-nem mezők:** az aláhúzott lehetőséget ismeri fel. Ha egyik sincs, vagy mindkettő ki van jelölve, a mezőt megjelöli.
- **Hozzáfűzéses cella:** a kari alapszöveg utáni részt veszi.
- **Ujjlenyomat-eltérés:** ha a Word az aktuális kari űrlaptól eltér (régebbi változat), a kérdésszöveg alapján keresi a mezőt, nem a hely alapján. Ami így sem feleltethető meg, azt megjelöli.

- **Két eltérés a kézzel kitöltött űrlapoktól** (a valódi júniusi beadáson derült ki):
  - az IGEN/NEM választást sokan félkövérrel jelölik, nem aláhúzással, ezért a félkövér és a kiemelés is kijelölésnek számít;
  - a 7.4 fejezetszámozása eltérhet a karitól, ezért a fejezetcímeket a sorszám nélkül veti össze.

A megjelölés egy HTML-megjegyzés a mező alatt (`<!-- kutetika: ellenőrizendő: … -->`). A `kerelem.md` beolvasója ezt figyelmen kívül hagyja, a formai ellenőrzés viszont jelzi. A tájékoztatót és a kérdőívet nem olvassa be szövegként, csak mellékletként veszi fel.
*Alternatíva:* az asszisztens olvassa a Wordöt és gépel át. Elvetve alapútnak, mert hosszú űrlapnál kihagy és átfogalmaz. Tartaléknak megmarad a megjelölt mezőkre.

### 5. ELTE-s cím: formai szabály, tartományillesztéssel
A formai réteg a 7.2 kutatásvezetői e-mail mezőjét nézi (magyar 7.2: `[5]`, az angolban a megfelelő mező). A cím akkor elfogadható, ha a `@` utáni rész pontosan `elte.hu`, vagy `.elte.hu`-ra végződik. A kifogás súlyossága „javítandó”, szabályzati hivatkozás nélkül, a szövege: „a bizottság ELTE-s címet kér”.
Hogy a mezőt ne kelljen fixen beírni a kódba, a mezőtérképben a mező új `ellenorzes: "elte-email"` jelölést kap. Ugyanez a jelölés kerülhet majd a 7.4 kapcsolattartói mezőjére is, ha kiderül, hogy a bizottság ott is ezt kéri.
*Nyitott értelmezés:* az értékelőlap „ELTE-s cím megadása szükséges” mondata jelenthet postacímet is. A kutató gmailes e-mailt adott meg, ezért a legvalószínűbb az e-mail. Az ELTE-s munkahely a 7.2-ben már szerepelt. Ezt az első éles átdolgozáskor érdemes a titkárságnál megerősíteni (lásd Open Questions).

### 6. Bírálat átdolgozáskor: az értékelőlap és a válaszlevél is a csomagba kerül
A csomag új `bizottsag/` mappát kap: benne az értékelőlap (PDF) és a válaszlevél szöveges másolata. A bíráló SKILL.md új, 7. kategóriát kap („Bizottsági pontok lefedése”), amely csak akkor él, ha a `bizottsag/` mappa létezik.
A tiszta kontextus elve így sem sérül. Az értékelőlap a bizottság dokumentuma, nem a beszélgetés terméke. A `dontesek.md` és az `atdolgozas.md` indoklásai továbbra sem kerülnek a csomagba, csak a válaszlevél, amelyet a bizottság is megkap.
*Alternatíva:* a bíráló ne lássa az értékelőlapot, hogy független maradjon. Elvetve, mert akkor nem tudja ellenőrizni a legfontosabbat: hogy minden kért javítás tényleg megtörtént-e. A független teljes bírálat megmarad, mert a bíráló a bizottsági pontokon túl is a teljes beadványt nézi.

### 7. Válaszlevél: a program állítja elő az `atdolgozas.md`-ből
*(A megvalósítás során módosítva; eredetileg a skill írta volna.)* A levelet a segédprogram minden előállításkor újraírja: `keab/valaszlevel.md`, és egy egyszerű Word-fájl a kari fájlnév-konvencióval (`Válaszlevél a Bizottság értékelésére (VEZETEKNEV_DATUM).docx`). A tartalma:
- az előző eljárás azonosítója;
- a `# Kísérőszöveg`;
- pontonként a bizottság szövege, az állapot, valamint a „Mi változott” vagy az „Indoklás”.

A rögzített feliratok a beadvány nyelvén jelennek meg, a kutató szövegét a skill a beadvány nyelvén íratja.
*Miért így:* ha a skill írná, a levél és a pontok állapota elcsúszhatna egymástól (egy „nyitott” pont „javítva”-ként szerepelhetne a levélben). Így a levél mindig pontosan azt mondja, amit az `atdolgozas.md`.
A Word-fájl a csatolandók közé kerül, és a „mehet” pillanatképébe a `valaszlevel.md`-vel és az `atdolgozas.md`-vel együtt.

## Risks / Trade-offs

- **Szkennelt értékelőlap:** a pontokra bontás az asszisztens olvasásán múlik. → A pontok szövege szó szerint bekerül az `atdolgozas.md`-be, és a kutató a skill kérésére összeveti a papírral, mielőtt a feldolgozás indul.
- **Hibás beolvasás Wordből** (aláhúzás helyett félkövér, összevont cellák). → A bizonytalan mezők megjelölve, a formai ellenőrzés jelzi őket. A beolvasás tesztjei a kari űrlapon, kézzel kitöltött mintán futnak.
- **Túl szigorú ELTE-szabály:** külső témavezető, emeritus vagy más egyetemi cím. → Csak „javítandó”, a kutató a meglévő felülbírálással továbbléphet, indoklással.
- **A bíráló a bizottságot visszhangozza:** az értékelőlap ismeretében a bíráló csak a bizottsági pontokat nézheti. → A SKILL.md kimondja, hogy a teljes bírálat kötelező. A teszt egy javítás közben bekerült új ellentmondással ellenőrzi, hogy a bíráló ezt is megtalálja.
- **Személyes adat a második AI-szolgáltatónál:** az értékelőlapon nevek szerepelnek. → Ugyanaz az engedély és tájékoztatás vonatkozik rá, mint a beadványra. Az engedélykérés szövege kiegészül az értékelőlappal.

## Migration Plan

Nincs adatmigráció. A régi projektekben nincs `atdolgozas.md`, ott minden a mostani módon fut. Az archiválás sorrendje: előbb az `elso-valtozat`, mert ennek a változtatásnak az ADDED követelményei a `ellenseges-ellenorzes` és a `kerelem-keszites` képességhez kerülnek.

## Open Questions

- Mit jelent pontosan az „ELTE-s cím”: e-mail vagy postacím? Az első éles átdolgozáskor (GoSchool-kérelem) a titkárságtól meg kell kérdezni, és ha kell, a szabályt módosítani.
- Az átdolgozott kérelmet ugyanarra a címre, ugyanabban a levélláncban kell-e visszaküldeni? A kar oldala erről nem szól. Addig a `bead.md` azt mondja, hogy kérdezze meg a titkárságot.
