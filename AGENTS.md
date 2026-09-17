# AGENTS.md

Útmutató az ebben a repóban dolgozó AI-asszisztenseknek (Claude Code, Codex, Copilot stb.).

## A projekt

A `kutetika` egy telepíthető eszköz. A kutató a saját AI-asszisztensével végigmegy vele az ELTE TáTK Kutatásintegritási, Etikai és Adatkezelési Bizottságához (KEAB) beadandó kutatásetikai engedélykérelmen. A részletek a [README.md](README.md)-ben vannak. Munka előtt olvasd el.

A projekt még a kezdetén tart: a README a terv, az eszköz maga még nem készült el.

## Kivel dolgozol

**A projekt gazdája nem fejlesztő.** Kutató, aki tudja, mit akar elérni, de a programozás, a git és a technikai eszközök nem az ő terepe. Ennek megfelelően:

- **Magyarul, közérthetően beszélj.** Kerüld a szakzsargont. Ha egy technikai szó elkerülhetetlen (pl. branch, commit, npm), egy félmondatban magyarázd meg, mit jelent.
- **Azt mondd el, mi történt és miért, ne azt, hogyan.** „Elmentettem a változásokat egy külön munkaágra, a fő változat érintetlen" jobb, mint egy git-parancs kimenete.
- **Ne kódrészletekkel válaszolj.** Kódot csak akkor mutass, ha kéri, vagy ha elkerülhetetlen, és akkor is mondd el szavakkal, mit csinál.
- **A döntéseket a tartalom nyelvén tedd fel.** Ne azt kérdezd, hogy „YAML vagy JSON legyen a konfig?", hanem azt, ami neki számít („A kutató maga is szerkesztheti ezt a fájlt, vagy csak a gép?"). A technikai részleteket döntsd el te, és röviden mondd el, mit választottál.
- **Ha valami nem fordítható vissza, előtte kérdezz.** Törlés, feltöltés GitHubra, közzététel, bármi, ami kifelé megy.
- **Ha valami nem sikerült, mondd ki egyenesen,** és javasolj következő lépést.
- **Rövid válaszokat adj.** Az elején a lényeg, a részletek csak ha kellenek.

## Szakmai alapelvek az eszközhöz

Ezek a README-ből következnek, és a fejlesztés során végig érvényesek:

- **A kutatási adatot alapból nem olvassa, csak külön engedéllyel.**
  - A projekt *leírását* és a *kutatási eszközöket* (kérdőív, interjúvázlat, tájékoztató) szabadon olvashatja. Ezek nem kutatási adatok, és kellenek a kérelemhez.
  - A nyers kutatási adatot (a `data/` mappát, a válaszokat, felvételeket, leiratokat) csak akkor, ha a kérelemhez szükséges. Ilyen például, ha másodelemzésnél ellenőrizni kell, hogy az adat tényleg anonim-e, vagy az adatkezelési tervhez kell tudni, milyen adatfajták vannak benne.
  - Olvasás előtt megmondja, melyik fájlt nézné meg és miért, és hogy a tartalom az AI-szolgáltatóhoz kerül. Csak akkor olvassa el, ha a kutató arra az alkalomra kifejezetten engedélyt ad. Csak annyit olvas, amennyi kell (pl. az oszlopneveket, nem a válaszokat).
  - Minden ilyen engedély bekerül a `keab/dontesek.md`-be.
  - Ha személyes adat kerülne az AI-szolgáltatóhoz, figyelmeztet: ez maga is adatkezelés, és az adatkezelési tervben szerepelnie kell.
  - Ezt a szabályt telepítéskor a kutató projektjének `AGENTS.md`-jébe is be kell írnia.
- **A kar űrlapjait és szabályzatát nem tartalmazza,** hanem a kar oldaláról (https://tatk.elte.hu/bizottsagok/kutetika) tölti le, hogy mindig a hatályos változattal dolgozzon.
- **Nem ad jogi tanácsot és nem dönt a kutató helyett.** Felsorolja a lehetőségeket, hivatkozik a szabályzatra, megmondja, kihez kell fordulni. Minden döntés bekerül a `keab/dontesek.md`-be: mit döntött a kutató, mit javasolt a gép.
- **Nem küldi el a kérelmet** és nem garantálja az engedélyt: formát ellenőriz, nem etikát.
- **A 7.5-ös vizsgálati eljárással nem foglalkozik.**
- **A felhasználói felület a beszélgetés,** és a kimenet magyar nyelvű.

## Munkamód

- A `main` ág a stabil változat. Új munkát külön ágon végezz.
- Commitolni és feltölteni csak kérésre.
