# kutetika

## 1. Mi ez?

Egy telepíthető eszköz, amely a kutató saját munkaterületén, a saját AI-asszisztensével (Claude Code, Codex, Copilot) végigvezet a TáTK Kutatásintegritási, Etikai és Adatkezelési Bizottságához (KEAB) benyújtandó kutatásetikai engedélykérelmen. Egy paranccsal kerül a projektbe, mint az OpenSpec vagy hasonló skillsetek. Utána beszélgetve eldönti, kell-e engedély, kikérdezi, ami a projekt leírásából nem derül ki, és kitölti a kar hivatalos űrlapjait.

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
- **A kar hivatalos űrlapjai:** 7.1 Kutatásintegritási nyilatkozat, 7.2 Kutatásintegritási űrlap, 7.4 Adatkezelési terv, `.docx`. Ezeket az eszköz **nem tartalmazza**, hanem telepítéskor a kar oldaláról tölti le, hogy mindig a hatályos változattal dolgozzon.
- **A kari szabályzat** (PDF, a kar oldaláról): ebből dönt és hivatkozik.
- **Mennyiség:** egy projekt, három űrlap, plusz a mellékletek.
- **Adatvédelem:** az eszköz a projekt *leírását* olvassa, a kutatási adatot nem. A `data/` mappához nem nyúlhat. Ezt telepítéskor be kell írnia az `AGENTS.md`-be.

**Ki használja, és hogyan:** felhasználói eszköz. A kutató a saját gépén dolgozik:

```text
> npx install -g @kutetika@latest              # skillek + űrlapok + szabályzat a projektbe
> kutetika init

majd az ai agentben

> kell nekem etikai engedély?  
> csináljuk meg a kérelmet     
> nézd át, mielőtt elküldöm    
```


## 5. Mi jön ki?

Egy `keab/` mappa a projektben:

```text
keab/
  dontesek.md                                   ← mit döntött a kutató, mit javasolt a gép
  7.2 Kutatásintegritási űrlap (VEZETEKNEV_DATUM).docx
  7.4 Adatkezelési terv (VEZETEKNEV_DATUM).docx
  7.1 Kutatásintegritási nyilatkozat (VEZETEKNEV_DATUM).docx
  tajekoztato-es-hozzajarulo-nyilatkozat.docx
  bead.md                                       ← kinek, mit, mikor
```

**Egy konkrét példa:**

*Bemegy egy kutató teljes repója*

*Kijön beszélgetés után a beadandó anyag*

**Határok. Az eszköz nem:**

- **küldi el** a kérelmet: a kutatásvezető küldi, digitális aláírással, a saját címéről;
- **dönt** jogalapról, és nem ad jogi tanácsot, csak a lehetőségeket sorolja fel, és megmondja, kihez kell fordulni;
- **garantálja** az engedélyt: formát ellenőriz, nem etikát;
- **foglalkozik** a vizsgálati eljárással (7.5), ami már futó kutatás bejelentése;
- **olvassa** a kutatási adatot.

## 6. Honnan tudod, hogy jó?

**Mihez hasonlítom:** a bizottság döntéséhez

## 7. Mi hiányzik, és mi az első lépés?

**Ami hiányzik:**

- az eszköz

