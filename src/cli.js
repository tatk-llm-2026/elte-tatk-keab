const SUGO = `kutetika – ELTE TáTK kutatásetikai engedélykérelem az AI-asszisztensével

Használat:
  kutetika init        a kutetika telepítése ebbe a projektbe
  kutetika --help      ez a súgó
  kutetika --version   a telepített változat

Gépi parancsok: kutetika <parancs> [projektmappa] [JSON-beállítások]
  vaz                 üres keab/kerelem.md a beadvány nyelvén (meglévőt nem ír felül)
  eloallit             frissítés, Word, formai ellenőrzés, bírálói átadás
  munkaanyag-biralat   korai bírálat, Word és mehet nélkül
  biralat-folytat      függő pillanatkép új átadása
  biralat-rogzit       külön bíráló eredménye tokennel és kérésazonosítóval
  kulso-engedely       név szerinti kutatói engedély vagy elutasítás
  felulbiral           befejezett bírálat kifogásai, kutatói indokkal
  allapot             mehet újraszámítása a fájlok aktuális bájtjaiból
  frissites           kari dokumentumok frissítésfigyelése
A JSON-beállítás fájlból is jöhet: @keab/.beallitas.json
A gépi parancsok JSON-t adnak; sikeres művelet nem jelent mehet állapotot.
Nincs külön Word-író parancs.

A többi parancsot az asszisztens hívja; kézzel nem kell futtatni.
`;

const parancsok = {};

export function regisztral(nev, fuggveny) {
  parancsok[nev] = fuggveny;
}

export async function main(args) {
  const [parancs, ...tobbi] = args;
  if (!parancs || parancs === '--help' || parancs === '-h') {
    process.stdout.write(SUGO);
    return 0;
  }
  if (parancs === '--version' || parancs === '-v') {
    const { verzio } = await import('./csomag.js');
    process.stdout.write(`${verzio()}\n`);
    return 0;
  }
  const fuggveny = parancsok[parancs];
  if (!fuggveny) {
    process.stderr.write(`Ismeretlen parancs: ${parancs}\n\n${SUGO}`);
    return 1;
  }
  return fuggveny(tobbi);
}
