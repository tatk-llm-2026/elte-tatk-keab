import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { eloallit } from '../src/eloallitas.js';
import { biralatRogzit } from '../src/biralat.js';
import { allapot, felulbiral, formaiEllenorzes, mellekletekEllenoriz } from '../src/ellenorzes.js';
import { beolvas, vazKeszit } from '../src/kerelem.js';
import { mezoterkepBetolt } from '../src/mezoterkep.js';
import { allapotOlvas, allapotIr } from '../src/munkafolyamat.js';
import { docxMegnyit, szerkezetesSzoveg } from '../src/docx.js';

const options = { asszisztens: 'claude', elerheto: [], subagent: true, mellekletek: [], datum: '2026-09-17T12:00:00Z', frissitesEllenoriz: async () => ({ allapot: 'egyezik', figyelmeztetesek: [] }) };
function projekt(t, nyelv = 'hu') {
  const root = mkdtempSync(join(tmpdir(), 'kutetika-ell-'));
  mkdirSync(join(root, 'keab'));
  writeFileSync(join(root, 'keab/kerelem.md'), vazKeszit(nyelv));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}
function takarit(t, r) { if (r.keres?.mappa) t.after(() => rmSync(r.keres.mappa, { recursive: true, force: true })); }
const eredmeny = (r) => ({ token: r.token, keres: r.keres.azonosito, asszisztens: r.keres.asszisztens, mod: r.keres.mod, kifogasok: [] });

test('formai hibák: kötelező érték, min/max szó, melléklet, régi dokumentum és hibás Word', (t) => {
  const root = projekt(t);
  const draft = beolvas(vazKeszit('hu'));
  draft.valaszok['7.2']['17'] = Array(201).fill('szó').join(' ');
  const lista = formaiEllenorzes(root, { draft, terkepBetolto: mezoterkepBetolt, frissites: { allapot: 'nincs-illo-verzio' },
    mellekletek: [{ fajl: 'keab/szuloi.pdf', tipus: 'hozzajarulas', hely: 'kerelem.md 7.2/[14]', nemNyersAdat: true }],
    generalt: ['keab/hianyzik.docx'], wordok: ['keab/regi.docx'] });
  for (const id of ['ures:7.2/1', 'szoszam:7.2/12', 'szoszam:7.2/17', 'melleklet:keab/szuloi.pdf', 'word:keab/hianyzik.docx', 'regi-urlap', 'regi-kimenet:keab/regi.docx', 'tajekoztato']) assert.ok(lista.some((k) => k.azonosito === `formai:${id}`), id);
  assert.equal(lista[0].sulyossag, 'sulyos');
  assert.ok(lista.every((k) => k.hely && k.problema));
});

for (const fajl of ['data/valaszok.txt', 'keab/../AGENTS.md', 'keab/dontesek.md', 'keab/AGENTS.md', 'keab/.titok.md']) test(`tiltott melléklet: ${fajl}`, () => {
  assert.throws(() => mellekletekEllenoriz([{ fajl, tipus: 'kutatasi-eszkoz', hely: '7.2/[20]', nemNyersAdat: true }]));
});

for (const nyelv of ['hu', 'en']) test(`${nyelv}: hiányos munkaanyagból is négy Word, formai kifogások és függő bírálat`, async (t) => {
  const root = projekt(t, nyelv);
  const r = await eloallit(root, options);
  takarit(t, r);
  assert.equal(r.fajlok.length, 4);
  assert.ok(r.kifogasok.some((k) => k.azonosito === 'formai:tajekoztato'));
  assert.equal(r.keres.nyelv, nyelv);
  assert.equal(r.mehet, false);
  const bead = readFileSync(join(root, 'keab/bead.md'), 'utf8');
  for (const szoveg of ['keab@tatk.elte.hu', '10 munkanappal', 'digitális aláírással', 'kutetika verzió', '7.2-' + nyelv, 'biralatra-var']) assert.ok(bead.includes(szoveg));
});

test('kézi Word-változás előtt figyelmeztet, csak az aktuális megerősítő tokennel ír felül', async (t) => {
  const root = projekt(t);
  const elso = await eloallit(root, options);
  takarit(t, elso);
  const f = join(root, elso.fajlok[0]);
  writeFileSync(f, Buffer.concat([readFileSync(f), Buffer.from('kézi javítás')]));
  const bytes = readFileSync(f);
  const ker = await eloallit(root, options);
  assert.equal(ker.allapot, 'feluliras-megerositest-ker');
  assert.deepEqual(readFileSync(f), bytes);
  assert.ok(ker.figyelmeztetesek.some((s) => s.includes('kerelem.md')));
  assert.equal((await eloallit(root, { ...options, felulirasMegerosites: true })).allapot, 'feluliras-megerositest-ker');
  const uj = await eloallit(root, { ...options, felulirasMegerosites: ker.felulirasToken });
  takarit(t, uj);
  assert.equal(uj.allapot, 'biralatra-var');
  assert.notDeepEqual(readFileSync(f), bytes);
});

test('kifogás felülbírálása csak kész bírálat után, valódi indokkal; minden döntés naplózott', async (t) => {
  const root = projekt(t);
  const r = await eloallit(root, options);
  takarit(t, r);
  const dontesek = r.kifogasok.map((k) => ({ azonosito: k.azonosito, indok: 'A kutató által megadott tesztindok.' }));
  await assert.rejects(felulbiral(root, { token: r.token, dontesek }));
  await biralatRogzit(root, eredmeny(r));
  await assert.rejects(felulbiral(root, { token: r.token, dontesek: [{ azonosito: dontesek[0].azonosito, indok: '' }] }));
  const kesz = await felulbiral(root, { token: r.token, dontesek });
  assert.equal(kesz.mehet, true);
  assert.equal(kesz.felulbiralasok.length, dontesek.length);
  assert.match(readFileSync(join(root, 'keab/dontesek.md'), 'utf8'), /kutatoiDontes.*A kutató által megadott tesztindok/);
  assert.match(readFileSync(join(root, 'keab/bead.md'), 'utf8'), /Felülbírált kifogások/);
  writeFileSync(join(root, 'keab/kerelem.md'), vazKeszit('hu') + '\n');
  assert.equal((await allapot(root)).mehet, false);
  await assert.rejects(felulbiral(root, { token: r.token, dontesek }));
});

for (const valtozas of ['word-torles', 'melleklet', 'uj-word']) test(`beadandó bájtpillanatkép: ${valtozas} érvénytelenít`, async (t) => {
  const root = projekt(t);
  writeFileSync(join(root, 'keab/kerdoiv.txt'), 'Kitalált kérdés');
  const r = await eloallit(root, { ...options, mellekletek: [{ fajl: 'keab/kerdoiv.txt', tipus: 'kutatasi-eszkoz', hely: 'kerelem.md 7.2/[20]', nemNyersAdat: true }] });
  takarit(t, r);
  await biralatRogzit(root, eredmeny(r));
  await felulbiral(root, { token: r.token, dontesek: r.kifogasok.map((k) => ({ azonosito: k.azonosito, indok: 'Kutatói tesztindok.' })) });
  assert.equal((await allapot(root)).mehet, true);
  if (valtozas === 'word-torles') rmSync(join(root, r.fajlok[0]));
  if (valtozas === 'melleklet') writeFileSync(join(root, 'keab/kerdoiv.txt'), 'Módosított kérdés');
  if (valtozas === 'uj-word') writeFileSync(join(root, 'keab/uj.docx'), readFileSync(join(root, r.fajlok[0])));
  assert.equal((await allapot(root)).allapot, 'ervenytelen');
});

test('sérült állapot és hiányzó előállítás nem ad mehet-et; újraelőállítás óvja az ismeretlen Wordöt', async (t) => {
  const root = projekt(t);
  assert.equal((await allapot(root)).allapot, 'nincs-eloallitas');
  const r = await eloallit(root, options);
  takarit(t, r);
  const eredeti = allapotOlvas(root);
  for (const modositas of [(s) => { s.futas.biralat = { allapot: 'kesz' }; }, (s) => { s.futas.felulbiralasok = [null]; }, (s) => { s.futas.formai = null; }]) {
    const s = structuredClone(eredeti);
    modositas(s);
    allapotIr(root, s);
    assert.equal((await allapot(root)).allapot, 'serult-allapot');
  }
  writeFileSync(join(root, 'keab/.ellenorzes.json'), '{hibás');
  assert.equal((await allapot(root)).mehet, false);
  assert.equal((await eloallit(root, options)).allapot, 'feluliras-megerositest-ker');
});

test('CLI magyar JSON-protokoll; ismeretlen beállítás és önálló Word-írás nem elérhető', (t) => {
  const root = projekt(t);
  const cli = (...args) => spawnSync(process.execPath, ['bin/kutetika.js', ...args], { encoding: 'utf8' });
  const r = cli('allapot', root);
  assert.equal(r.status, 0);
  assert.equal(JSON.parse(r.stdout).mehet, false);
  const hibas = cli('eloallit', root, '{"asszisztens":"claude","skipReview":true}');
  assert.equal(hibas.status, 1);
  assert.equal(JSON.parse(hibas.stdout).allapot, 'hiba');
  assert.equal(cli('word', root).status, 1);
});

test('üres tartalom: a kari sablon helykitöltői maradnak, a Wordök érvényesek, a kifogások megvannak', async (t) => {
  const root = projekt(t);
  const r = await eloallit(root, options);
  takarit(t, r);
  assert.equal(r.fajlok.length, 4);
  for (const f of r.fajlok) {
    const szoveg = szerkezetesSzoveg(docxMegnyit(readFileSync(join(root, f))).dom);
    assert.ok(szoveg.trim().length > 0 || f.includes('Tájékoztató'), f);
    if (f.includes('7.4')) assert.match(szoveg, /\[a kutatás céljának/);
  }
  assert.match(readFileSync(join(root, 'keab/bead.md'), 'utf8'), /Üres kötelező érték/);
  assert.equal(r.mehet, false);
});
