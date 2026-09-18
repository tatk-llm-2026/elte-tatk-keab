import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cellaSzoveg, docxMegnyit, gyerekek } from '../src/docx.js';
import { mezoterkepBetolt, szerkezetEllenorzes, tablazatok } from '../src/mezoterkep.js';
import { ujjlenyomat } from '../src/ujjlenyomat.js';

const jegyzek = JSON.parse(readFileSync('dokumentumok/jegyzek.json', 'utf8'));
const urlapDom = (azonosito) => docxMegnyit(readFileSync(`dokumentumok/${azonosito}.docx`)).dom;

for (const urlap of ['7.1', '7.2', '7.4']) {
  for (const nyelv of ['hu', 'en']) {
    const terkep = mezoterkepBetolt(urlap, nyelv);
    const dom = urlapDom(`${urlap}-${nyelv}`);

    test(`${urlap}-${nyelv}: a térkép illeszkedik az űrlaphoz`, () => {
      assert.deepEqual(szerkezetEllenorzes(dom, terkep), []);
      assert.equal(terkep.ujjlenyomat, jegyzek.dokumentumok.find((d) => d.azonosito === `${urlap}-${nyelv}`).ujjlenyomat);
      assert.equal(terkep.ujjlenyomat, ujjlenyomat(readFileSync(`dokumentumok/${urlap}-${nyelv}.docx`), 'docx'));
    });

    test(`${urlap}-${nyelv}: a mezőazonosítók egyediek`, () => {
      const azonositok = terkep.mezok.map((m) => m.azonosito);
      assert.equal(new Set(azonositok).size, azonositok.length);
    });
  }
}

for (const nyelv of ['hu', 'en']) {
  test(`7.2-${nyelv}: minden kérdéssor pontosan egy mezőhöz tartozik`, () => {
    const terkep = mezoterkepBetolt('7.2', nyelv);
    const dom = urlapDom(`7.2-${nyelv}`);
    const tbls = tablazatok(dom);
    // Kérdéssor: a táblázatok azon sorai, amelyek második cellájában szöveg van (az utolsó, tájékoztató táblázat kivételével).
    const kerdesSorok = [];
    tbls.slice(0, 4).forEach((tbl, ti) =>
      gyerekek(tbl, 'tr').forEach((tr, si) => {
        const cellak = gyerekek(tr, 'tc');
        if (cellak.length >= 2 && cellaSzoveg(cellak[1]).trim()) kerdesSorok.push(`${ti}/${si}`);
      }),
    );
    const mezoSorok = terkep.mezok.filter((m) => m.kerdesHely).map((m) => `${m.kerdesHely.tablazat}/${m.kerdesHely.sor}`);
    assert.deepEqual([...mezoSorok].sort(), [...kerdesSorok].sort());
    const kitoltendo = terkep.mezok.filter((m) => ['cella', 'cella-hozzafuzes', 'igen-nem'].includes(m.tipus)).map((m) => m.azonosito);
    assert.deepEqual(kitoltendo, Array.from({ length: 40 }, (_, i) => String(i + 1)));
  });

  test(`7.2-${nyelv}: szószámkorlátok`, () => {
    const terkep = mezoterkepBetolt('7.2', nyelv);
    const korlat = Object.fromEntries(terkep.mezok.filter((m) => m.szoszam).map((m) => [m.azonosito, m.szoszam]));
    assert.deepEqual(korlat, { 12: { min: 100, max: 200 }, 17: { min: null, max: 200 } });
  });

  test(`7.4-${nyelv}: a 3–16. fejezet mind mező`, () => {
    const terkep = mezoterkepBetolt('7.4', nyelv);
    const fejezetek = terkep.mezok.filter((m) => m.tipus === 'bekezdes').map((m) => m.azonosito);
    assert.deepEqual(fejezetek, Array.from({ length: 14 }, (_, i) => String(i + 3)));
  });
}

test('szerkezetellenőrzés: módosított kérdésszöveget észrevesz', () => {
  const terkep = mezoterkepBetolt('7.2', 'hu');
  const hamis = { ...terkep, mezok: terkep.mezok.map((m) => (m.azonosito === '5' ? { ...m, kerdes: 'Telefonszáma:' } : m)) };
  assert.deepEqual(szerkezetEllenorzes(urlapDom('7.2-hu'), hamis), ['5: a kérdés szövege eltér']);
});
