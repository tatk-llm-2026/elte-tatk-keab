## Context

A repóban még nincs kód. A motiváció a `proposal.md`-ben, a követelmények a `specs/` mappában vannak. A tervet ezek a korlátok alakítják:

- A felhasználó kutató, nem fejlesztő. A telepítés legyen egy parancs, a használat beszélgetés.
- Három asszisztenst kell támogatni (Claude Code, Codex, Copilot), amelyek hasonló, de nem azonos módon kezelik a skilleket és a subagenteket.
- A kar űrlapjai táblázatos Word-dokumentumok, verziószám nélkül. A kar oldala jelenleg dokumentum-azonosítós letöltési linkeket ad (pl. `tatk.elte.hu/dstore/document/2231/...`).
- A kitöltött űrlapnak Wordben megnyitva a kari űrlappal azonos szerkezetűnek kell lennie.

## Goals / Non-Goals

**Goals:**
- A kitöltés és az ellenőrzés formai része (mező helye, szószám, üres mező, fájl-ujjlenyomat) determinisztikus kód legyen, ne az asszisztensen múljon.
- A tartalmi munka (kikérdezés, szövegírás, bírálat) a skillekben legyen, asszisztenstől függetlenül.
- Egy forrásból készüljön mindhárom asszisztens skillje.

**Non-Goals:**
- Saját felület vagy weboldal.
- Saját AI-hívás a csomagból (API-kulcs, költség): minden nyelvi munkát a kutató saját asszisztense végez.
- A 7.3 értékelő űrlap és a 7.5 vizsgálati űrlap.

## Decisions

### 1. Terjesztés: npm-csomag parancssori eszközzel
A `kutetika` npm-csomag (a név szabad), `npx kutetika@latest init` indítással. Az eszköz tartalmaz egy kis parancssori programot is, amelyet a skillek hívnak (kitöltés, formai ellenőrzés, állapot, frissítésfigyelés).
- *Miért:* a három asszisztens parancssori változata is npm-mel települ, így a Node többnyire már megvan a kutató gépén. A parancssori segédprogram egy helyen, tesztelhetően tartja a determinisztikus részeket.
- *Alternatívák:* Python-csomag (a kutatók egy részének van Pythonja, de a telepítése gyakrabban akad el); csak skillek segédprogram nélkül (a Word-kitöltés és az ujjlenyomat akkor az asszisztensen múlna, és asszisztensenként eltérően működne).

### 2. Mi kerül a kutató projektjébe
- Skillek a három asszisztens helyére: `.claude/skills/`, `.agents/skills/`, `.github/skills/`. Egy forrásból másolva, azonos tartalommal.
- `.kutetika/`: a csomagolt kari dokumentumok (eredeti `.docx` és `.pdf`), a szabályzat kinyert szöveges változata, a mezőtérképek és a `jegyzek.json` (verzió, dokumentumok forráscíme és ujjlenyomata).
- `AGENTS.md`: a kutetika-blokk `<!-- kutetika:kezdet -->` és `<!-- kutetika:veg -->` jelölők között, így újratelepítéskor cserélhető.
- `CLAUDE.md`: azonos jelölők közé tett `@AGENTS.md` betöltés. A Claude Code nem olvassa automatikusan az `AGENTS.md`-t; ezt a korábbi kipróbálás állapította meg, és a projektgazda jóváhagyta a kivételt. A telepítő a két utasításfájl jelölt blokkjain kívüli saját tartalmat és sorvégeket megőrzi, hiányzó fájlt létrehoz, újratelepítéskor nem dupláz.
- A `keab/` mappát nem az inicializálás, hanem az első kérelem hozza létre, és az újratelepítés nem nyúl hozzá.
- *Miért a szabályzat szöveges változata:* az asszisztensek a PDF-et drágán és pontatlanul olvassák. A kiadáskor kinyert, fejezetekre bontott szöveg pontos hivatkozást tesz lehetővé.

### 3. Három skill
- `kutetika-engedely`: kell-e engedély, ki a kutatásvezető.
- `kutetika-kerelem`: kikérdezés, a `kerelem.md` munkaanyag vezetése, `dontesek.md`, és a beadvány előállítása (frissítésfigyelés, Word, ellenőrzés, `bead.md`).
- `kutetika-biralat`: az ellenséges ellenőrzés.

Mindhárom használatkor először lefuttatja a frissítésfigyelést.

A skillek szövege angolul készül. A skill az asszisztensnek szóló utasítás, nem a kutatónak: az asszisztensek angol utasítást követnek a legmegbízhatóbban, és így egy utasításkészlet szolgálja ki a magyar és az angol beadványt is. A kutatóval az asszisztens a kutató nyelvén beszél, a beadvány szövege a választott beadványnyelven készül; a skillek ezt kifejezetten előírják. A kari szakkifejezések (pl. űrlapmezők nevei, szabályzati hivatkozások) a skillekben az eredeti magyar és angol alakjukban szerepelnek.
- *Alternatíva:* egyetlen nagy skill. Elvetve, mert a bírálónak külön, szűkebb utasítás kell, és a „kell-e engedély?" kérdéshez nem kell a teljes kitöltési útmutatót betölteni.

### 4. Munkaanyag helyben, Word csak előállításkor
A kérelem tartalma a `keab/kerelem.md` munkaanyagban gyűlik: űrlaponként egy fő fejezet, mezőnként egy alfejezet, amelynek címe a mező azonosítóját és a kérdés szövegét tartalmazza, alatta a válasz. Ez a kutatónak olvasható és javítható, a segédprogramnak pedig a fejezetcímek alapján egyértelműen feldolgozható. A Word-fájlok csak a beadvány előállításakor készülnek el belőle.
- A segédprogram az űrlap mezőtérképe alapján beírja a válaszokat a `.docx` belső XML-jébe a megfelelő cellába, a sablon formázását megtartva.
- A mezőtérkép űrlaponként és nyelvenként készül (6 db), és rögzíti a mező azonosítóját, a helyét, a kérdés szövegét, a szószámkorlátot, és hogy a Bizottság tölti-e ki. A `kerelem.md` üres váza is a mezőtérképből készül.
- A mezőtérkép a dokumentum ujjlenyomatához kötött: más ujjlenyomatú űrlapra a segédprogram nem ír.
- Az előállítás egyetlen parancs, amely sorban lefuttatja a frissítésfigyelést, a Word-előállítást, a formai ellenőrzést és a bíráló indítását; a Word-előállítás külön nem hívható. Így nincs Word ellenőrzés nélkül.
- A segédprogram az előállításkor feljegyzi a Word-fájlok ujjlenyomatát. Ha a következő előállítás előtt a Word-fájl ujjlenyomata eltér, figyelmeztet, hogy a kézi módosítás felülíródik.
- *Miért nem közvetlenül a Wordben dolgozunk:* a munkaanyag a beszélgetés közben is olvasható és javítható, verziókövethető, és az asszisztens könnyen írja. A Word így végtermék, amely mindig egy ellenőrzött lépésben készül.
- *Alternatívák:* YAML válaszfájl (programozói formátum, a kutatónak nehezen olvasható); az asszisztens szerkessze közvetlenül a Word XML-jét (asszisztensenként eltérő eredmény, könnyen elrontja a táblázatot); új dokumentum generálása sablon nélkül (nem azonos a kari űrlappal).

### 5. Ujjlenyomat: a szöveges tartalomból
Az ujjlenyomat a dokumentum normalizált szövegének (szóközök és sortörések egységesítve) SHA-256 kivonata, nem a fájl bájtjaié.
- *Miért:* ha a kar csak újramenti a fájlt, a bájtok változnak, a tartalom nem. Bájtalapú ujjlenyomatnál ez fölösleges főverziót és riasztást okozna.
- *Kompromisszum:* a csak formázási változás rejtve marad. Ezt elfogadjuk, mert a kitöltést a szöveg és a táblázatszerkezet határozza meg; a mezőtérkép szerkezetellenőrzése a táblázat változását külön is észreveszi.
- A Word-dokumentumok szövege a táblázat sor- és cellahatárait is jelöli, így a szerkezet változása is új ujjlenyomatot ad.
- *Kivétel, a szabályzat PDF-jei:* ezeknél a fájl bájtjaiból készül az ujjlenyomat. A PDF szövegének kinyeréséhez nagy függőség kellene a kutató gépén, a kar pedig a PDF-et nem menti újra, hanem cseréli. Ha mégis téves riasztás jön, az új verzió kiadásakor kiderül, hogy a szöveg nem változott.

### 6. Frissítésfigyelés
A segédprogram letölti a kar oldalát, megkeresi a hat űrlap és a két szabályzat linkjét, letölti őket, és összeveti az ujjlenyomatokat a `jegyzek.json`-nal. Eltérésnél lekérdezi az npm-ről a kiadott verziókat. Minden verzió `package.json`-ja tartalmazza a dokumentum-ujjlenyomatokat, így a csomag letöltése nélkül kideríthető, melyik verzió illik az új dokumentumokhoz.
- Az eredményt egy napig gyorsítótárazza, hogy ne lassítson minden kérdésnél.
- Ha a link nem található (a kar átalakította az oldalt), azt ugyanúgy jelzi, mint a sikertelen ellenőrzést.

### 7. Ellenséges ellenőrzés: tiszta kontextus, két rétegben
- **Formai réteg (segédprogram):** üres kötelező mezők, szószámkorlát, a mellékletek megléte, régi űrlap. Ez gépi, és mindig ugyanazt adja.
- **Tartalmi réteg (bíráló skill):** ellentmondások az űrlapok között, a szabályzatnak nem megfelelő tartalom, csak a beszélgetésből érthető válaszok.
- Előállításkor a bíráló a kész Word-fájlokat olvassa, mert a bizottság is azt kapja. Előállítás előtti kérésnél a `kerelem.md`-t; ilyenkor „mehet" nem születik.
- A bíráló mindig tiszta kontextusban fut, és csak a beadvány anyagát, a szabályzatot és az űrlapokat kapja meg. A `dontesek.md`-t szándékosan nem kapja meg, mert az a beszélgetés gondolatmenetét tartalmazza.
- **A bíráló kiválasztása, preferencia-sorrendben:**
  1. **Másik asszisztens** a gépen, parancssoron nem interaktív módban indítva (Claude Code-ból a Codex, Codexből vagy Copilotból a Claude Code). A segédprogram megnézi, melyik asszisztens parancssori programja érhető el, és a kutató engedélye után ezt hívja meg a bíráló utasításával és a fájlokkal.
  2. **Subagent** a saját asszisztensben, ha támogatja.
  3. **Új beszélgetés:** az előállítás a Word-fájlok és a formai ellenőrzés után megáll, és az eszköz új beszélgetés indítását kéri a bírálathoz.
- *Miért a másik asszisztens az első:* egy másik gyártó modelljének más a vakfoltja, így az ellenséges bírálat függetlenebb. Ugyanez a minta ismert más skillcsomagokból is (pl. a gstack a Claude Code-ból Codexet hív második véleményért).
- **Engedély:** a másik asszisztens használata a beadványt egy második AI-szolgáltatóhoz juttatja. Az eszköz ezért először megkérdezi a kutatót, a választ a `dontesek.md`-be írja, és a segédprogram a `keab/.ellenorzes.json`-ban is tárolja, hogy ne kérdezzen újra.
- „Mehet" csak a bírálat lefutása után lehet. A bírálat eredménye rögzíti, melyik asszisztens és milyen módon bírált.
- *Alternatíva:* a bírálat ugyanabban a beszélgetésben. Elvetve, mert így a bíráló a kutató fejével olvasna.

**Ellenőrzött képességek (2026-09-17, feladat 1.1):**

| Asszisztens | Projekt-skillek | Subagent | Nem interaktív indítás |
|---|---|---|---|
| Claude Code 2.1.236 | igen (`.claude/skills/`) | igen | `claude -p` |
| Codex CLI 0.147.0 | igen (`.agents/skills/`) | igen (`multi_agent` stabil) | `codex exec -s read-only --ephemeral -o <fájl>` |
| GitHub Copilot CLI | nem ellenőrzött | nem ellenőrzött | nem ellenőrzött |

A Copilot új parancssori programja a fejlesztői gépen nem volt telepítve (csak a régi `gh copilot` bővítmény, amely nem asszisztens), ezért ezt még ki kell próbálni.

### 8. „Mehet": ujjlenyomat a beadandó fájlokról
Az előállításkori ellenőrzés eredményét a segédprogram a `keab/.ellenorzes.json`-ba írja: időpont, a `kerelem.md` és a beadandó Word-fájlok ujjlenyomata, a kifogások és a felülbírált kifogások. A „mehet" állapotot mindig ebből számolja újra: ha a munkaanyag vagy bármelyik beadandó fájl ujjlenyomata eltér, a „mehet" nem érvényes. A `bead.md` ember által olvasható összefoglalót kap ugyanerről.

### 9. Karbantartói figyelés
A GitHub-repóban hetente automatikusan lefut ugyanaz a frissítésfigyelés, és eltérésnél hibajegyet nyit. Így a karbantartó értesül, hogy új verziót kell kiadni.

### 10. Tesztelés kitalált kutatásokon
Kitalált mintaprojektek készülnek a jellemző esetekre: iskolai kutatás kiskorúakkal; interjús kutatás AI-leiratkészítéssel; anonimizált adatok másodelemzése (határeset); doktorandusz mint megnevezett kutatásvezető; angol beadvány. A segédprogram részei automatikus tesztet kapnak, a skilleket ezeken a mintaprojekteken próbáljuk ki mindhárom asszisztensben.

A projektgazda jóváhagyta a háromrendszeres automatikus tesztelést: a `.github/workflows/tesztek.yml` minden feltöltéskor, változtatási kérelemnél és kézi indításra futtatja az `npm test` parancsot Windowson, macOS-en és Linuxon, Node 20, 22 és 24 mellett. A beállítás helyben elkészült; a távoli futás még nincs ellenőrizve, feltöltés nem történt.

## Risks / Trade-offs

- [A kutató gépén nincs Node] → A README és a telepítési üzenet lépésről lépésre leírja a telepítést, és a hibaüzenet közérthető.
- [Az asszisztensek eltérően kezelik a skilleket és a subagenteket] → Az első feladatok között szerepel mindhárom ellenőrzése; ahol nincs subagent, ott az új beszélgetéses megoldás él.
- [A kar átalakítja az oldalát, és a linkek nem találhatók] → A figyelés ezt „nem sikerült ellenőrizni"-ként jelzi a kutatónak, a heti karbantartói figyelés pedig hibajegyet nyit.
- [A kar módosít, és sokáig nincs új verzió] → A kutató figyelmeztetést kap, a bíráló kifogásként jelzi; a munka folytatható.
- [A csak formázási változás rejtve marad] → Elfogadott kompromisszum (lásd 5. döntés).
- [A bíráló téved] → A kutató felülbírálhatja; a felülbírálás rögzítve van.
- [A kutató kézzel szerkeszti a Word-fájlt, és a javítás elvész a következő előállításkor] → A „mehet" elvész, és újraelőállítás előtt figyelmeztetés javasolja, hogy a javítást a `kerelem.md`-be vigye át.
- [A kutató a `kerelem.md` fejezetcímeit is átírja, és a segédprogram nem találja a mezőt] → Az előállítás megnevezi a hiányzó vagy felismerhetetlen mezőt, és az asszisztens helyreállítja a címet a válasz megtartásával.

## Migration Plan

Nincs mit átállítani, ez az első változat. A kiadás menete: a dokumentumok letöltése, a mezőtérképek elkészítése, a szabályzat szövegének kinyerése, tesztek, majd közzététel az npm-en. Visszalépés: az npm-en egy hibás verzió elavultnak jelölhető, és a kutató az előző verzióval újra inicializálhat.

## Open Questions

- Mennyi a kari ülésrend és a beadási határidő? A kar oldala nem közöl ülésnaptárt. A `bead.md` addig csak a szabályzatban rögzített határidőszabályt írja le, konkrét dátumot nem.
