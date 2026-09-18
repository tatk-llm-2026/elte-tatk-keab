import { test } from 'node:test';
import assert from 'node:assert/strict';
import { beolvas, munkaanyagMezo, szoszam, vazKeszit } from '../src/kerelem.js';
import { mezoterkepBetolt, URLAPOK } from '../src/mezoterkep.js';

for (const nyelv of ['hu', 'en']) {
  test(`${nyelv}: a váz minden munkaanyag-mezőt tartalmaz, és üresen beolvasható`, () => {
    const vaz = vazKeszit(nyelv);
    const { nyelv: olvasott, valaszok, hibak } = beolvas(vaz);
    assert.equal(olvasott, nyelv);
    assert.deepEqual(hibak, []);
    for (const urlap of URLAPOK) {
      const vart = mezoterkepBetolt(urlap, nyelv).mezok.filter(munkaanyagMezo).map((m) => m.azonosito);
      assert.deepEqual(Object.keys(valaszok[urlap]).sort(), [...vart].sort(), urlap);
      assert.ok(Object.values(valaszok[urlap]).every((v) => v === ''), urlap);
    }
  });
}

test('a váz nem tartalmazza a bizottsági, átvett és automatikus mezőket', () => {
  const vaz = vazKeszit('hu');
  assert.doesNotMatch(vaz, /## \[azonosito\]/);
  assert.doesNotMatch(vaz, /## \[kutatas-cime\]/);
  const urlap72 = vaz.slice(vaz.indexOf('# 7.2 '), vaz.indexOf('# 7.4 '));
  assert.doesNotMatch(urlap72, /## \[11\]/);
  assert.doesNotMatch(vaz, /## \[keszult\]/);
});

test('kézzel átírt válasz helyesen olvasható be, a megjegyzések kimaradnak', () => {
  const vaz = vazKeszit('hu')
    .replace('## [5] E-mail címe:\n', '## [5] E-mail címe:\nkutato@tatk.elte.hu\n')
    .replace(/(## \[12\] [^\n]*\n<!--[^\n]*-->\n)/, '$1Első bekezdés.\n\nMásodik bekezdés.\n')
    .replace('# Tájékoztató és hozzájáruló nyilatkozat\n', '# Tájékoztató és hozzájáruló nyilatkozat\nKedves Résztvevő!\n\n# Adatkezelési tájékoztató\nA tájékoztató része.\n');
  const { valaszok, tajekoztato, hibak } = beolvas(vaz);
  assert.equal(valaszok['7.2']['5'], 'kutato@tatk.elte.hu');
  assert.equal(valaszok['7.2']['12'], 'Első bekezdés.\n\nMásodik bekezdés.');
  assert.equal(tajekoztato, 'Kedves Résztvevő!\n\n# Adatkezelési tájékoztató\nA tájékoztató része.');
  assert.deepEqual(hibak, []);
});

test('ismeretlen főcím, kettőzött mező, NFD-ékezet és vezérlőkarakter', () => {
  const vaz = vazKeszit('hu')
    .replace('# 7.4 ', '# Jegyzeteim\nsaját\n\n# 7.4 ')
    .replace('## [5] E-mail címe:\n', '## [5] E-mail címe:\nkutato@tatk.elte.hu\u000B\n## [5] E-mail címe:\nmasik@tatk.elte.hu\n')
    .replace(/(## \[12\] [^\n]*\n<!--[^\n]*-->\n)/, `$1${'A kutatás célja az iskolai jóllét vizsgálata'.normalize('NFD')}\n`);
  const { valaszok, hibak } = beolvas(vaz);
  assert.equal(valaszok['7.2']['5'], 'kutato@tatk.elte.hu\n\nmasik@tatk.elte.hu');
  assert.equal(szoszam(valaszok['7.2']['12']), 7);
  assert.equal(hibak.length, 2);
  assert.match(hibak[0], /kétszer/);
  assert.match(hibak[1], /Jegyzeteim/);
});

test('angol munkaanyagban a magyar tájékoztató-cím is felismerhető', () => {
  const vaz = vazKeszit('en').replace('# Statement of information and consent', '# Tájékoztató és hozzájáruló nyilatkozat') + 'Dear participant!\n';
  const { tajekoztato, hibak } = beolvas(vaz);
  assert.equal(tajekoztato, 'Dear participant!');
  assert.deepEqual(hibak, []);
});

test('felismerhetetlen mezőcímnél megnevezi a címet és a hiányzó mezőt', () => {
  const vaz = vazKeszit('hu').replace('## [5] E-mail címe:', '## E-mail címe');
  const { hibak } = beolvas(vaz);
  assert.deepEqual(hibak, [
    'Felismerhetetlen mezőcím a 7.2 űrlapnál: „## E-mail címe”',
    'Hiányzik a 7.2 űrlap [5] mezőjének címsora.',
  ]);
});

test('nyelvjelölés nélkül hibát ad', () => {
  assert.equal(beolvas('# 7.2 valami').hibak.length, 1);
});

test('szószám', () => {
  assert.equal(szoszam('A kutatás célja – egy 2026-os vizsgálat, e-mail: a@b.hu.'), 8);
});

test('Windows-sorvégekkel (CRLF) és BOM-mal mentett munkaanyag', () => {
  const vaz = `\uFEFF${vazKeszit('hu').replace('## [5] E-mail címe:\n', '## [5] E-mail címe:\nkutato@tatk.elte.hu\n').replace(/\n/g, '\r\n')}`;
  const { valaszok, hibak } = beolvas(vaz);
  assert.deepEqual(hibak, []);
  assert.equal(valaszok['7.2']['5'], 'kutato@tatk.elte.hu');
});
