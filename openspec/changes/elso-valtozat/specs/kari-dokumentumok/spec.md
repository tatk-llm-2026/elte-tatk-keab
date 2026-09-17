## Purpose

A kar hivatalos dokumentumai a csomagban vannak, a kutetika verziója követi a változásaikat, és a kutató tudomást szerez róla, ha a kar módosított valamit.

## ADDED Requirements

### Requirement: A dokumentumok a csomagban
A kutetika csomag SHALL tartalmazza a kar oldaláról származó alábbi dokumentumokat magyarul és angolul: 7.1 Kutatásintegritási nyilatkozat, 7.2 Kutatásintegritási űrlap, 7.4 Adatkezelési terv, valamint a kari kutatásintegritási szabályzat. A skillek SHALL ezekre a csomagolt dokumentumokra épüljenek.

#### Scenario: Hálózat nélküli kitöltés
- **WHEN** a kutató gépén nincs internetkapcsolat
- **THEN** az eszköz a csomagolt dokumentumokkal el tudja készíteni a kérelmet

### Requirement: Dokumentum-azonosítók
Minden kiadott kutetika-verzió SHALL rögzítse a benne lévő minden kari dokumentum tartalmi ujjlenyomatát, hogy összevethető legyen a kar oldalán elérhető változattal.

#### Scenario: Azonosítók egy verzióban
- **WHEN** valaki megnézi egy kiadott kutetika-verzió dokumentumlistáját
- **THEN** minden kari dokumentumhoz látja a forrás címét és az ujjlenyomatát

### Requirement: Szemantikus verziózás a kar változásaihoz
Ha a kar bármelyik nyelvű dokumentumot módosítja, SHALL új kutetika-verzió készüljön főverzió-emeléssel. Új képesség SHALL alverzió-emelést, javítás SHALL javítóverzió-emelést kapjon.

#### Scenario: A kar módosítja az angol 7.2-t
- **WHEN** a kar módosítja az angol nyelvű 7.2 űrlapot, a magyar változatlan
- **THEN** a következő kutetika-kiadás főverziót emel, és az új angol űrlapot tartalmazza

### Requirement: Változásfigyelés használatkor
Az eszköz SHALL használatkor összevesse a csomagolt dokumentumokat a kar oldalán elérhetőkkel, mindkét nyelven.
- Ha egyeznek, SHALL ne szóljon.
- Ha eltérnek, és van már az új dokumentumokat tartalmazó kutetika-verzió, SHALL szóljon, hogy frissíteni kell, és megnevezze a verziót.
- Ha eltérnek, és még nincs hozzájuk illő verzió, SHALL szóljon, hogy a kar módosított, de még nincs hozzá kutetika-verzió.
- Ha az összevetés nem sikerül (pl. nincs internet), SHALL közölje, hogy nem tudta ellenőrizni.

Az eszköz SHALL egyik esetben se akadályozza meg a munka folytatását.

#### Scenario: Van új verzió
- **WHEN** a kar módosította a magyar 7.4-et, és már létezik az új 7.4-et tartalmazó kutetika-verzió
- **THEN** az eszköz szól, hogy a kar módosította a 7.4-et, és megnevezi a frissítendő verziót

#### Scenario: Nincs még új verzió
- **WHEN** a kar módosította az angol 7.1-et, és még nincs hozzá kutetika-verzió
- **THEN** az eszköz szól, hogy a kar módosította a 7.1-et, de még nincs hozzá kutetika-verzió, és a kutató folytathatja a munkát

#### Scenario: Nincs internet
- **WHEN** a kar oldala nem érhető el
- **THEN** az eszköz közli, hogy nem tudta ellenőrizni a kari dokumentumokat, és a munka folytatható

### Requirement: Nem kezelt dokumentum
A kutetika SHALL ne tartalmazza és ne töltse ki a 7.5 Kutatásetikai vizsgálati űrlapot.

#### Scenario: 7.5 kérése
- **WHEN** a kutató a 7.5-ös űrlap kitöltését kéri
- **THEN** az eszköz jelzi, hogy ezzel nem foglalkozik
