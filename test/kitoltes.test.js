import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { XMLSerializer } from '@xmldom/xmldom';
import { strFromU8, unzipSync } from 'fflate';
import { bekezdesSzoveg, cellaSzoveg, docxMegnyit, docxMent, gyerekek, W } from '../src/docx.js';
import { datumSzoveg, igenNemBontas, kitolt, UrlapEltérésHiba, valaszBekezdesek } from '../src/kitoltes.js';
import { bekezdesek, cella, mezoterkepBetolt } from '../src/mezoterkep.js';

const DATUM = new Date(2026, 8, 17);
const urlap = (azon) => readFileSync(`dokumentumok/${azon}.docx`);
const szoveg = (dom) => bekezdesek(dom).map(bekezdesSzoveg).join('\n');

const VALASZOK = {
  '7.2': {
    1: 'Dr. Minta Anna',
    5: 'minta.anna@tatk.elte.hu',
    6: 'Iskolai jóllét vizsgálata',
    12: 'Első bekezdés a célról.\n\nMásodik bekezdés,\nsortöréssel.',
    14: 'Szülői tájékoztató; intézményvezetői hozzájárulás',
    27: 'IGEN\nA helyzeteket előre egyeztetjük.',
    28: 'NEM',
    35: 'N/A',
  },
  '7.4': { 3: 'A kutatás célja az iskolai jóllét feltárása.\n\nMásodik bekezdés.', jogszabalyok: 'igen', felelos: 'kutatás' },
  '7.1': {
    telepules: 'Budapest',
    resztvevok: Array.from({ length: 11 }, (_, i) => `Személy ${i + 1} | N${i} | közreműködő`).join('\n'),
  },
};

const kitoltott = (azon) => {
  const [u, nyelv] = azon.split('-');
  return docxMegnyit(kitolt(urlap(azon), mezoterkepBetolt(u, nyelv), VALASZOK, { datum: DATUM }));
};

test('7.2: a válaszok a helyükön vannak', () => {
  const terkep = mezoterkepBetolt('7.2', 'hu');
  const { dom } = kitoltott('7.2-hu');
  const hely = (azon) => cella(dom, terkep.mezok.find((m) => m.azonosito === azon).hely);
  assert.equal(cellaSzoveg(hely('1')), 'Dr. Minta Anna');
  assert.equal(cellaSzoveg(hely('11')), '2026. szeptember 17.');
  assert.equal(cellaSzoveg(hely('12')), 'Első bekezdés a célról.\nMásodik bekezdés,\nsortöréssel.');
  assert.equal(gyerekek(hely('12'), 'p').length, 2);
  assert.match(cellaSzoveg(hely('14')), /^Ha a résztvevő személy 3 év alatti[\s\S]*\nSzülői tájékoztató; intézményvezetői hozzájárulás$/);
  assert.equal(cellaSzoveg(hely('27')), 'A helyzeteket előre egyeztetjük.');
  assert.equal(cellaSzoveg(hely('35')), 'N/A');
  assert.equal(cellaSzoveg(hely('2')), '', 'üres válasznál a cella üres marad');
});

test('7.2: az igen/nem jelölés félkövér és aláhúzott, sémahelyes sorrendben', () => {
  const terkep = mezoterkepBetolt('7.2', 'hu');
  const { dom } = kitoltott('7.2-hu');
  const m27 = terkep.mezok.find((m) => m.azonosito === '27');
  const m28 = terkep.mezok.find((m) => m.azonosito === '28');
  const kiemelt = (tc) => [...tc.getElementsByTagNameNS(W, 'r')].every((r) => {
    const rPr = gyerekek(r, 'rPr')[0];
    const nevek = [...rPr.childNodes].filter((n) => n.nodeType === 1).map((n) => n.localName);
    return nevek.includes('b') && nevek.includes('u') && nevek.indexOf('b') < nevek.indexOf('u');
  });
  assert.ok(kiemelt(cella(dom, m27.igenHely)));
  assert.ok(!kiemelt(cella(dom, m27.nemHely)));
  assert.ok(kiemelt(cella(dom, m28.nemHely)));
  assert.ok(!kiemelt(cella(dom, m28.igenHely)));
});

test('7.2: a válasz bekezdése a sablon formázását kapja, dőlt nélkül', () => {
  const terkep = mezoterkepBetolt('7.2', 'hu');
  const eredeti = docxMegnyit(urlap('7.2-hu')).dom;
  const { dom } = kitoltott('7.2-hu');
  const hely = terkep.mezok.find((m) => m.azonosito === '1').hely;
  const s = new XMLSerializer();
  const pPr = (tc) => s.serializeToString(gyerekek(gyerekek(tc, 'p')[0], 'pPr')[0]);
  assert.equal(pPr(cella(dom, hely)), pPr(cella(eredeti, hely)));
  assert.equal(dom.getElementsByTagNameNS(W, 'tbl').length, eredeti.getElementsByTagNameNS(W, 'tbl').length);
});

test('7.4: helykitöltők, névelő, dátumrag, fejezetszöveg, jogszabály-emlékeztető', () => {
  const { dom } = kitoltott('7.4-hu');
  const t = szoveg(dom);
  assert.match(t, /^az Iskolai jóllét vizsgálata$/m);
  assert.match(t, /dokumentumok 2026\. szeptember 17-én hatályos/);
  assert.match(t, /felelősséget a kutatás vezetője vállalja/);
  assert.match(t, /^A kutatás célja az iskolai jóllét feltárása\.\nMásodik bekezdés\.$/m);
  assert.doesNotMatch(t, /\[kutatás címe\]|\[a kutatás céljának|felülvizsgálata szükséges/);
  assert.match(t, /\[a kutatás azonosítószáma\]/, 'a Bizottság mezője érintetlen');
  assert.match(t, /\[a kezelendő személyes adatok/, 'üres válasznál az útmutató marad');
  const cel = bekezdesek(dom).find((p) => bekezdesSzoveg(p).startsWith('A kutatás célja az iskolai'));
  assert.equal(cel.getElementsByTagNameNS(W, 'i').length, 0);
});

test('7.1: kelte, cím és a résztvevők táblázata szükség szerint bővül', () => {
  const { dom } = kitoltott('7.1-hu');
  const t = szoveg(dom);
  assert.match(t, /^Az Iskolai jóllét vizsgálata című kutatás/m);
  assert.match(t, /^Budapest, 2026\. szeptember 17\.$/m);
  const tbl = dom.getElementsByTagNameNS(W, 'tbl')[0];
  const sorok = gyerekek(tbl, 'tr');
  assert.equal(sorok.length, 12);
  assert.deepEqual(gyerekek(sorok[11], 'tc').map(cellaSzoveg), ['Személy 11', 'N10', 'közreműködő', '']);
});

test('angol űrlap: cím és dátum', () => {
  const { dom } = kitoltott('7.1-en');
  const valaszok = { ...VALASZOK, '7.1': { telepules: 'Budapest' } };
  const angol = docxMegnyit(kitolt(urlap('7.1-en'), mezoterkepBetolt('7.1', 'en'), valaszok, { datum: DATUM })).dom;
  assert.match(szoveg(angol), /^Budapest, 17\. September 2026\.$/m);
  assert.match(szoveg(dom), /entitled Iskolai jóllét vizsgálata/);
});

test('a Word-fájl többi része változatlan', () => {
  const elotte = unzipSync(new Uint8Array(urlap('7.2-hu')));
  const utana = unzipSync(new Uint8Array(kitolt(urlap('7.2-hu'), mezoterkepBetolt('7.2', 'hu'), VALASZOK, { datum: DATUM })));
  assert.deepEqual(Object.keys(utana).sort(), Object.keys(elotte).sort());
  for (const nev of Object.keys(elotte)) {
    if (nev !== 'word/document.xml') assert.equal(strFromU8(utana[nev]), strFromU8(elotte[nev]), nev);
  }
});

test('eltérő ujjlenyomatú űrlapra nem ír', () => {
  const doc = docxMegnyit(urlap('7.2-hu'));
  const t = [...doc.dom.getElementsByTagNameNS(W, 't')].find((e) => e.textContent.includes('E-mail'));
  t.textContent = 'Telefonszáma:';
  assert.throws(() => kitolt(docxMent(doc), mezoterkepBetolt('7.2', 'hu'), VALASZOK), UrlapEltérésHiba);
});

test('segédfüggvények', () => {
  assert.deepEqual(valaszBekezdesek('a\n\n\nb  \nc\n'), ['a', 'b\nc']);
  assert.deepEqual(igenNemBontas('Igen.\nleírás'), { dontes: 'igen', leiras: 'leírás' });
  assert.deepEqual(igenNemBontas('NO'), { dontes: 'nem', leiras: '' });
  assert.equal(igenNemBontas('talán').dontes, null);
  assert.equal(datumSzoveg(DATUM, 'en'), '17 September 2026');
});

for (const u of ['7.1', '7.2', '7.4']) {
  for (const nyelv of ['hu', 'en']) {
    test(`${u}-${nyelv}: teljes kitöltés után újra megnyitható, és minden munkaanyag-mező a helyén van`, () => {
      const terkep = mezoterkepBetolt(u, nyelv);
      const valaszok = { '7.1': {}, '7.2': {}, '7.4': {} };
      for (const m of terkep.mezok) {
        if (m.tipus === 'igen-nem') valaszok[u][m.azonosito] = `${m.valaszok.igen}\nMagyarázat ${m.azonosito}.`;
        else if (m.tipus === 'megerosites') valaszok[u][m.azonosito] = 'igen';
        else if (m.tipus === 'sorok') valaszok[u][m.azonosito] = 'Egy Ember | N1 | kutató';
        else if (m.valasztas) valaszok[u][m.azonosito] = m.valasztas[1];
        else valaszok[u][m.azonosito] = `Válasz ${m.azonosito}.`;
      }
      if (u !== '7.2') valaszok['7.2']['6'] = 'Címe a kutatásnak';
      const ki = kitolt(urlap(`${u}-${nyelv}`), terkep, valaszok, { datum: DATUM });
      const { dom } = docxMegnyit(ki);
      const t = szoveg(dom);
      for (const m of terkep.mezok) {
        if (m.minta && !['bizottsagi'].includes(m.tipus)) assert.ok(!t.includes(m.minta), `${m.azonosito}: maradt helykitöltő`);
        if (['cella', 'bekezdes'].includes(m.tipus) && !m.alapertek) assert.ok(t.includes(`Válasz ${m.azonosito}.`), m.azonosito);
        if (m.tipus === 'igen-nem') assert.ok(t.includes(`Magyarázat ${m.azonosito}.`), m.azonosito);
      }
      assert.doesNotMatch(t, /\[(?!a kutatás azonosítószáma|registration number of research)[^\]]*\]/);
    });
  }
}

test('a helykitöltőt tartalmazó válasz nem okoz végtelen ciklust', { timeout: 5000 }, () => {
  const valaszok = { ...VALASZOK, '7.2': { ...VALASZOK['7.2'], 6: 'Munkacím [kutatás címe] később' } };
  const { dom } = docxMegnyit(kitolt(urlap('7.4-hu'), mezoterkepBetolt('7.4', 'hu'), valaszok, { datum: DATUM }));
  assert.match(szoveg(dom), /^a Munkacím \[kutatás címe\] később$/m);
});

test('7.1: a Markdown-táblázat fejlécsora nem kerül be résztvevőként', () => {
  const valaszok = { ...VALASZOK, '7.1': { ...VALASZOK['7.1'], resztvevok: '| Név | Neptun kód | Szerepkör |\n|---|---|---|\n| Egy Ember | N1 | kutató |' } };
  const { dom } = docxMegnyit(kitolt(urlap('7.1-hu'), mezoterkepBetolt('7.1', 'hu'), valaszok, { datum: DATUM }));
  const sorok = gyerekek(dom.getElementsByTagNameNS(W, 'tbl')[0], 'tr');
  assert.deepEqual(gyerekek(sorok[1], 'tc').slice(0, 3).map(cellaSzoveg), ['Egy Ember', 'N1', 'kutató']);
});

test('hónap elseje: 1-jén', () => {
  const { dom } = docxMegnyit(kitolt(urlap('7.4-hu'), mezoterkepBetolt('7.4', 'hu'), VALASZOK, { datum: new Date(2026, 9, 1) }));
  assert.match(szoveg(dom), /2026\. október 1-jén hatályos/);
});
