// A csomagban lévő kari dokumentumok jegyzéke: forrás és ujjlenyomat dokumentumonként.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { KARI_DOKUMENTUMOK } from './kar.js';
import { ujjlenyomat } from './ujjlenyomat.js';

export function jegyzekKeszit(dokumentumMappa, forrasok, kutetikaVerzio) {
  return {
    kutetikaVerzio,
    dokumentumok: KARI_DOKUMENTUMOK.map((dok) => ({
      azonosito: dok.azonosito,
      nyelv: dok.nyelv,
      tipus: dok.tipus,
      fajl: dok.fajl,
      forras: forrasok[dok.azonosito] ?? null,
      ujjlenyomat: ujjlenyomat(readFileSync(join(dokumentumMappa, dok.fajl)), dok.tipus),
    })),
  };
}

// A package.json-ba kerülő rövid változat: azonosító -> ujjlenyomat.
// Az npm-ről lekérdezhető anélkül, hogy a csomagot le kellene tölteni.
export function csomagUjjlenyomatok(jegyzek) {
  return Object.fromEntries(jegyzek.dokumentumok.map((d) => [d.azonosito, d.ujjlenyomat]));
}
