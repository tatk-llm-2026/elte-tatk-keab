## ADDED Requirements

### Requirement: A kutatásvezető ELTE-s címe
A kikérdezés során az eszköz SHALL a kutatásvezető ELTE-s e-mail címét kérje. Ha a projekt leírásában vagy a kutató válaszában nem ELTE-s cím szerepel, az eszköz SHALL jelezze, hogy a bizottság ELTE-s címet kér, és SHALL kérdezze meg az ELTE-s címet. Ha a kutatásvezetőnek nincs ELTE-s címe (pl. külső témavezető), az eszköz SHALL ezt rögzítse a `dontesek.md`-ben, és a KEAB titkárságához SHALL irányítsa a kutatót.

#### Scenario: Magáncím a leírásban
- **WHEN** a projekt leírásában a kutatásvezető e-mail címe gmailes
- **THEN** az eszköz rákérdez az ELTE-s címre, és azt írja a munkaanyag 7.2 e-mail mezőjébe

#### Scenario: Nincs ELTE-s cím
- **WHEN** a kutató azt mondja, hogy a kutatásvezetőnek nincs ELTE-s e-mail címe
- **THEN** az eszköz a meglévő címet írja be, a helyzetet rögzíti a `dontesek.md`-ben, és javasolja, hogy a kutató kérdezze meg a KEAB titkárságát
