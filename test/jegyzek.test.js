import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { KARI_DOKUMENTUMOK } from '../src/kar.js';
import { csomagUjjlenyomatok, jegyzekKeszit } from '../src/jegyzek.js';
import { ujjlenyomat } from '../src/ujjlenyomat.js';

const jegyzek = JSON.parse(readFileSync('dokumentumok/jegyzek.json', 'utf8'));
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

test('a jegyzék minden kari dokumentumot tartalmaz forrással és ujjlenyomattal', () => {
  assert.deepEqual(jegyzek.dokumentumok.map((d) => d.azonosito), KARI_DOKUMENTUMOK.map((d) => d.azonosito));
  for (const d of jegyzek.dokumentumok) {
    assert.match(d.forras, /^https:\/\/tatk\.elte\.hu\/dstore\/document\/\d+\//, d.azonosito);
    assert.equal(d.ujjlenyomat, ujjlenyomat(readFileSync(`dokumentumok/${d.fajl}`), d.tipus), d.azonosito);
  }
});

test('a jegyzék a csomagban lévő fájlokkal egyezik', () => {
  const friss = jegyzekKeszit('dokumentumok', Object.fromEntries(jegyzek.dokumentumok.map((d) => [d.azonosito, d.forras])), jegyzek.kutetikaVerzio);
  assert.deepEqual(friss, jegyzek);
});

test('a package.json ujjlenyomatai egyeznek a jegyzékkel', () => {
  assert.deepEqual(pkg.kutetika.dokumentumok, csomagUjjlenyomatok(jegyzek));
});

test('a jegyzék verziója a csomag verziója (különben a frissítésfigyelés minden kutatónál hibát ad)', () => {
  assert.equal(jegyzek.kutetikaVerzio, pkg.version, 'verzióváltás után futtassa: node scripts/dokumentumok-letoltese.js');
});
