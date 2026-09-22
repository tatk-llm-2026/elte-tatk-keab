## ADDED Requirements

### Requirement: ELTE-s e-mail cím
A formai ellenőrzés SHALL kifogást adjon „javítandó” súlyossággal, ha a 7.2 űrlap kutatásvezetői e-mail címe nem ELTE-s tartományba esik (`elte.hu` vagy annak aldomainje, pl. `tatk.elte.hu`). A kifogás SHALL megnevezze a `kerelem.md` mezőjét, és SHALL megmondja, hogy a bizottság ELTE-s címet kér. Szabályzati pontot SHALL ne jelöljön meg, mert ez a bizottság gyakorlata, nem a szabályzat szövege.

#### Scenario: Gmail-cím
- **WHEN** a 7.2 kutatásvezetői e-mail címe `valaki@gmail.com`
- **THEN** a formai ellenőrzés javítandó kifogást ad a 7.2 e-mail mezőjére, és kéri az ELTE-s címet

#### Scenario: Kari aldomain
- **WHEN** a 7.2 kutatásvezetői e-mail címe `valaki@tatk.elte.hu`
- **THEN** a formai ellenőrzés erre a mezőre nem ad kifogást

#### Scenario: Hasonló, de nem ELTE-s tartomány
- **WHEN** a kutatásvezetői e-mail cím `valaki@elte.hu.example.com` vagy `valaki@notelte.hu`
- **THEN** a formai ellenőrzés kifogást ad

### Requirement: A bizottsági pontok lefedése átdolgozáskor
Átdolgozott beadványnál a bírálati csomag SHALL tartalmazza a bizottság értékelőlapját és a válaszlevelet is. A bíráló SHALL minden bizottsági pontnál megvizsgálja, hogy a javított beadvány valóban kezeli-e, és SHALL „súlyos” kifogást adjon, ha egy pont a válaszlevél szerint javítva van, de a beadványban nem látszik a javítás. A bíráló SHALL továbbra is ne kapja meg a beszélgetést és a `dontesek.md`-t. Az átdolgozás nem új kérelem: a bíráló SHALL a bizottsági pontokon túl is a teljes beadványt bírálja.

#### Scenario: Csak a válaszlevélben javított pont
- **WHEN** a válaszlevél szerint a tájékoztató már tartalmazza a visszavonás jogát, de a mellékelt tájékoztatóban ez nem szerepel
- **THEN** a bíráló súlyos kifogást ad, és megnevezi a bizottsági pontot, a válaszlevél állítását és a tájékoztató helyét

#### Scenario: Új hiba a javításban
- **WHEN** a javítás során a 7.2 és a 7.4 közé új ellentmondás kerül
- **THEN** a bíráló ezt is kifogásként jelzi, akkor is, ha a bizottság erről nem írt
