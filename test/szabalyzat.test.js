import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fejezetekre } from '../src/szabalyzat.js';

// A szabályzat PDF-jének fejezetszerkezete (mindkét nyelven azonos számozás).
const VART_SZAMOK = [
  '1', '2', '3', '3.1', '3.1.1', '3.1.2', '3.1.3', '3.1.4', '3.1.5', '3.1.6', '3.1.7', '3.1.8', '3.1.9',
  '3.2', '3.2.1', '3.2.2', '4', '4.1', '4.1.1', '4.1.2', '4.1.3', '4.1.4', '4.2',
  '5', '5.1', '5.1.1', '5.1.2', '5.2', '5.2.1', '5.2.2', '6', '7',
  '7.1', '7.2', '7.3', '7.4', '7.5', '7.6', '7.7', '7.8',
];

const cimek = (nyelv) =>
  readFileSync(`dokumentumok/szabalyzat-${nyelv}.md`, 'utf8')
    .split(/\r?\n/)
    .filter((s) => /^#{2,6} \d/.test(s))
    .map((s) => s.replace(/^#+ /, ''));

for (const nyelv of ['hu', 'en']) {
  test(`a ${nyelv} szabályzat fejezetei a PDF szerkezetét követik`, () => {
    assert.deepEqual(cimek(nyelv).map((c) => c.split('. ')[0]), VART_SZAMOK);
  });
}

test('a kulcsfejezetek címei', () => {
  const hu = cimek('hu');
  assert.ok(hu.includes('5.1.1. Az eljárásra kötelezettek köre'));
  assert.ok(hu.includes('7.2. Kutatásintegritási űrlap'));
  const en = cimek('en');
  assert.ok(en.includes('5.1.1. Persons subject to the procedure'));
  assert.ok(en.includes('7.4. Plan for data processing (sample)'));
});

test('számozott felsorolás és hosszú sor nem lesz fejezetcím', () => {
  const szoveg = [
    '1. Bevezetés',
    'szöveg',
    '    1.1. Alfejezet',
    '    1. felsorolás első eleme',
    '2. Ez egy nagyon hosszú mondat, amely számmal kezdődik, de valójában a szöveg része, nem cím.',
    '2. Második fejezet',
  ].join('\n');
  assert.deepEqual(fejezetekre(szoveg).filter((f) => f.szam).map((f) => f.szam), ['1', '1.1', '2']);
});
