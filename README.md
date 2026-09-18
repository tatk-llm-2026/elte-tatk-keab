# kutetika

## 1. Mi ez?

Egy telepíthető eszköz, amely a kutató saját munkaterületén, a saját AI-asszisztensével (Claude Code, Codex, Copilot) végigvezet a TáTK Kutatásintegritási, Etikai és Adatkezelési Bizottságához (KEAB) benyújtandó kutatásetikai engedélykérelmen. Egy paranccsal kerül a projektbe. Utána beszélgetve eldönti, kell-e engedély, kikérdezi, ami a projekt leírásából nem derül ki, és kitölti a kar hivatalos űrlapjait. Beadás előtt egy független bíráló a bizottság szemével átnézi.

## 2. Milyen problémát old meg?

A kutatásintegritási kérelem nem bonyolult, de a kitöltés az. Három Word-űrlap, egy 33 oldalas szabályzat, és mellékletek, amelyek a résztvevők életkorától, a helyszíntől és az adatkezeléstől függenek. A kutató többnyire nem ott akad el, amit tud (miről szól a kutatás), hanem ott, amire nem gondolt:

- ki lehet a kutatásvezető (a szabályzat szerint csak PhD-val rendelkező kutató, doktorandusz nem),
- kell-e intézményvezetői hozzájárulás,
- mit jelent, hogy „kizárólag anonimizált adatok másodelemzése",
- és hogy az interjúk leiratát feldolgozó AI-szolgáltatás bekerül-e az adatkezelési tervbe.

Ha ezek kimaradnak, abból hiánypótlás lesz, ami havi ülésrendnél egy hónapot csúsztathat.

## 3. Hogyan csinálod most?

A kutató letölti az űrlapokat a [kar oldaláról](https://tatk.elte.hu/bizottsagok/kutetika), elolvassa (vagy nem) a szabályzatot, és kézzel kitölti a Wordöt. Aki már adott be, a régi kérelmét másolja át. Aki nem, kollégától kér mintát.

**Amit nem tudok:** mennyi idő ez egy kérelemnél, és a kérelmek mekkora része megy vissza hiánypótlásra. Ezt a kurzus résztvevőitől és a Bizottságtól lehetne megkérdezni. Enélkül nem tudom megmondani, mennyit spórol az eszköz.

## 4. Mi megy bele?

**A bemenet:**

- **A kutató projektje:** a git repó.
- **A kar hivatalos űrlapjai:** 7.1 Kutatásintegritási nyilatkozat, 7.2 Kutatásintegritási űrlap, 7.4 Adatkezelési terv, `.docx`, magyarul és angolul. Ezek **a csomagban vannak**, a kar oldaláról (https://tatk.elte.hu/bizottsagok/kutetika) letöltve.
- **A kari szabályzat** (PDF, magyarul és angolul, a csomagban): ebből dönt és hivatkozik. Az eszköz fejezetekre bontott szöveges változatot is kap belőle, hogy pontosan tudjon hivatkozni.
- **Hatályos változat:** használatkor az eszköz összeveti a csomagolt dokumentumokat a kar oldalával. Ha a kar módosított valamit, szól, és megmondja, melyik kutetika-verzió illik az új dokumentumokhoz. A munkát nem állítja meg. A kutetika verziószáma a kar dokumentumainak változását követi.
- **Mennyiség:** egy projekt, három űrlap, plusz a mellékletek.
- **Adatvédelem:** az eszköz a projekt *leírását* és a kutatási eszközöket (kérdőív, interjúvázlat) olvassa. A nyers kutatási adatot (`data/`) alapból nem, csak ha a kérelemhez kell, és a kutató arra az alkalomra külön engedélyt ad. Ezt telepítéskor be kell írnia az `AGENTS.md`-be.

**Ki használja, és hogyan:** felhasználói eszköz. A kutató a saját gépén dolgozik:

```text
> npx @arpadtamasi/elte-tatk-keab@latest init    # skillek + űrlapok + szabályzat a projektbe

majd az AI-asszisztensben

> kell nekem etikai engedély?  
> csináljuk meg a kérelmet     
> nézd át, mielőtt elküldöm    
```

A telepítéshez Node.js kell a gépen.

## 5. Mi jön ki?

Egy `keab/` mappa a projektben:

```text
keab/
  kerelem.md                                    ← munkaanyag: minden válasz ide kerül, kézzel is javítható
  dontesek.md                                   ← mit döntött a kutató, mit javasolt a gép
  7.2 Kutatásintegritási űrlap (VEZETEKNEV_DATUM).docx
  7.4 Adatkezelési terv (VEZETEKNEV_DATUM).docx
  7.1 Kutatásintegritási nyilatkozat (VEZETEKNEV_DATUM).docx
  Tájékoztató és hozzájáruló nyilatkozat (VEZETEKNEV_DATUM).docx
  bead.md                                       ← kinek, mit, mikor
```

**Hogyan készül:**

- **A beadvány nyelve** magyar vagy angol. Az elején rákérdez, és ez független attól, milyen nyelven beszélget a kutató.
- **A munkaanyag:** beszélgetés közben minden a `kerelem.md`-be kerül. A kutató és az eszköz is ezt javítja, a Word-fájlokat nem.
- **Előállítás:** a Word-fájlok csak akkor készülnek el, amikor a kutató kéri („állítsd elő a beadványt”). Egy lépésben fut le a kari dokumentumok ellenőrzése, a Word-fájlok kitöltése, a formai ellenőrzés és a független bírálat.
- **Független bírálat:** a bíráló nem látta a beszélgetést, csak a beadványt, az űrlapokat és a szabályzatot. Azt keresi, miből lehetne hiánypótlás. Lehet a gépen lévő másik asszisztens (pl. Codexben dolgozva a Claude), ha a kutató ehhez engedélyt ad, vagy a saját asszisztens tiszta lappal.
- **„Mehet”:** csak akkor jár, ha a bírálat lefutott, és pontosan arra a változatra szól, amelyet a bíráló látott. Ha utána bármi módosul, újra elő kell állítani. A kutató felülbírálhatja a kifogásokat; ez indoklással bekerül a `dontesek.md`-be és a `bead.md`-be.

**Egy konkrét példa:**

*Bemegy egy kutató teljes repója*

*Kijön beszélgetés után a beadandó anyag*

**Határok. Az eszköz nem:**

- **küldi el** a kérelmet: a kutatásvezető küldi, digitális aláírással, a saját címéről;
- **dönt** jogalapról, és nem ad jogi tanácsot, csak a lehetőségeket sorolja fel, és megmondja, kihez kell fordulni;
- **garantálja** az engedélyt: formát ellenőriz, nem etikát;
- **foglalkozik** a vizsgálati eljárással (7.5), ami már futó kutatás bejelentése;
- **olvassa** a kutatási adatot a kutató külön engedélye nélkül.

## 6. Honnan tudod, hogy jó?

**Mihez hasonlítom:** a bizottság döntéséhez

**Addig is:** kitalált mintaprojekteken próbáljuk ki a jellemző esetekre (iskolai kutatás kiskorúakkal, interjúk AI-leiratkészítéssel, anonimizált adatok másodelemzése, doktorandusz mint kutatásvezető, angol beadvány). A program gépi részei automatikus teszteket kapnak.

## 7. Mi hiányzik, és mi az első lépés?

**Ami hiányzik:**

- az eszköz első változata elkészült, de még nincs kiadva;
- kipróbálás a mintaprojekteken mindhárom asszisztensben (a Copilot még egyáltalán nincs kipróbálva);
- visszajelzés egy nem fejlesztő kutatótól;
- a bizottság véleménye.

A tervezés részletei az [openspec/changes/elso-valtozat](openspec/changes/elso-valtozat/) mappában vannak.

