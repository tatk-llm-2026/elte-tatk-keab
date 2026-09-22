import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { eloallit, munkaanyagBiralat } from '../src/eloallitas.js';
import { biralatRogzit, ADATKOZLES, tajekoztatas } from '../src/biralat.js';
import { allapot } from '../src/ellenorzes.js';
import { beolvas, munkaanyagMezo } from '../src/kerelem.js';
import { kitolt } from '../src/kitoltes.js';
import { cella, mezoterkepBetolt, URLAPOK } from '../src/mezoterkep.js';
import { docxMegnyit, docxMent, gyerekek, szerkezetesSzoveg, W } from '../src/docx.js';
import { ujjlenyomat } from '../src/ujjlenyomat.js';
import { urlapBeolvas } from '../src/beolvasas.js';
import { atdolgozasKezd, atdolgozasOlvas, valaszlevelSzoveg, wordBeolvas } from '../src/atdolgozas.js';
import { allapotOlvas } from '../src/munkafolyamat.js';

const DOK = new URL('../dokumentumok/', import.meta.url);
const sablon = (u, nyelv) => readFileSync(new URL(`${u}-${nyelv}.docx`, DOK));
const options = { asszisztens: 'claude', elerheto: [], subagent: true, mellekletek: [], datum: '2026-09-17T12:00:00Z', frissitesEllenoriz: async () => ({ allapot: 'egyezik', figyelmeztetesek: [] }) };

function projekt(t) {
  const root = mkdtempSync(join(tmpdir(), 'kutetika-atd-'));
  mkdirSync(join(root, 'keab'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}
function takarit(t, r) { if (r.keres?.mappa) t.after(() => rmSync(r.keres.mappa, { recursive: true, force: true })); }

// Kitalált kutatás minden mezőre, több bekezdéses és igen-nem válaszokkal.
function valaszok(nyelv) {
  const v = {};
  for (const u of URLAPOK) {
    v[u] = {};
    for (const m of mezoterkepBetolt(u, nyelv).mezok.filter(munkaanyagMezo)) {
      let s = `Válasz ${u}/${m.azonosito}, első bekezdés.\n\nMásodik bekezdés.`;
      if (m.szoszam?.min) s = Array(m.szoszam.min).fill('mintaszó').join(' ');
      if (m.tipus === 'igen-nem') s = m.azonosito === '27' ? `${m.valaszok.igen}\nA kellemetlen helyzetet előzetes tájékoztatás előzi meg.` : m.valaszok.nem;
      if (m.tipus === 'megerosites') s = 'igen';
      if (m.valasztas) s = m.valasztas[1];
      if (m.tipus === 'sorok') s = 'Minta Anna | ABC123 | kutatásvezető\nMinta Béla | DEF456 | közreműködő';
      if (m.tipus === 'helykitolto' && !m.valasztas) s = 'Budapest';
      if (m.tipus === 'cella-hozzafuzes') s = 'Tájékoztató és hozzájáruló nyilatkozat';
      if (m.ellenorzes === 'elte-email') s = 'minta.anna@tatk.elte.hu';
      if (u === '7.2' && m.azonosito === '1') s = 'Dr. Minta Anna';
      v[u][m.azonosito] = s;
    }
  }
  return v;
}

function kitoltottUrlapok(root, nyelv, v = valaszok(nyelv)) {
  const fajlok = {};
  for (const u of URLAPOK) {
    const f = `keab/beadott-${u}.docx`;
    writeFileSync(join(root, f), kitolt(sablon(u, nyelv), mezoterkepBetolt(u, nyelv), v, { datum: new Date('2026-06-01') }));
    fajlok[u] = f;
  }
  return fajlok;
}

// Kézi kitöltés utánzata: a cella szövege egyetlen futásban, a választás félkövérrel vagy aláhúzással.
function keziKitoltes(buffer, modosit) {
  const doc = docxMegnyit(buffer);
  const cellaIr = (hely, szoveg) => {
    const tc = cella(doc.dom, hely);
    const ps = gyerekek(tc, 'p');
    for (const p of ps.slice(1)) tc.removeChild(p);
    for (const r of gyerekek(ps[0], 'r')) ps[0].removeChild(r);
    const r = doc.dom.createElementNS(W, 'w:r');
    const t = doc.dom.createElementNS(W, 'w:t');
    t.appendChild(doc.dom.createTextNode(szoveg));
    r.appendChild(t);
    ps[0].appendChild(r);
  };
  const kiemel = (hely, nev) => {
    for (const r of cella(doc.dom, hely).getElementsByTagNameNS(W, 'r')) {
      let rPr = gyerekek(r, 'rPr')[0];
      if (!rPr) { rPr = doc.dom.createElementNS(W, 'w:rPr'); r.insertBefore(rPr, r.firstChild); }
      const e = doc.dom.createElementNS(W, `w:${nev}`);
      if (nev === 'u') e.setAttributeNS(W, 'w:val', 'single');
      rPr.appendChild(e);
    }
  };
  modosit({ doc, cellaIr, kiemel });
  return docxMent(doc);
}

for (const nyelv of ['hu', 'en']) test(`${nyelv}: az eszközzel kitöltött űrlapok oda-vissza változatlanul beolvashatók`, async (t) => {
  const root = projekt(t);
  const v = valaszok(nyelv);
  const r = await wordBeolvas(root, { nyelv, fajlok: kitoltottUrlapok(root, nyelv, v) });
  assert.equal(r.allapot, 'beolvasva');
  // A jogszabályok felülvizsgálatát a kutatónak kell megerősítenie; minden más egyezik.
  assert.deepEqual(r.ellenorizendo.map((e) => `${e.urlap}/${e.mezo}`), ['7.4/jogszabalyok']);
  const draft = beolvas(readFileSync(join(root, 'keab/kerelem.md'), 'utf8'));
  assert.deepEqual(draft.hibak, []);
  for (const u of URLAPOK) for (const [azon, ertek] of Object.entries(v[u])) {
    if (azon === 'jogszabalyok') continue;
    assert.equal(draft.valaszok[u][azon], ertek, `${u}/${azon}`);
  }
  assert.ok(draft.ellenorizendo['7.4'].jogszabalyok);
  // A beolvasott munkaanyagból újra előállítva a cellaválaszok változatlanok (3.5).
  writeFileSync(join(root, 'keab/kerelem.md'), readFileSync(join(root, 'keab/kerelem.md'), 'utf8').replace(/<!-- kutetika: ellenőrizendő:[^>]*-->\n/, 'igen\n'));
  const e = await eloallit(root, options);
  takarit(t, e);
  const ujra = urlapBeolvas(sablon('7.2', nyelv), readFileSync(join(root, e.fajlok[0])), mezoterkepBetolt('7.2', nyelv));
  for (const [azon, ertek] of Object.entries(v['7.2'])) assert.equal(ujra.valaszok[azon], ertek, azon);
});

test('meglévő munkaanyagot a beolvasás nem ír felül', async (t) => {
  const root = projekt(t);
  writeFileSync(join(root, 'keab/kerelem.md'), 'kézzel írt');
  const r = await wordBeolvas(root, { nyelv: 'hu', fajlok: kitoltottUrlapok(root, 'hu') });
  assert.equal(r.allapot, 'mar-letezik');
  assert.equal(readFileSync(join(root, 'keab/kerelem.md'), 'utf8'), 'kézzel írt');
});

test('kézzel kitöltött 7.2: cellák, félkövér és aláhúzott választás; bizonytalan választás megjelölve', () => {
  const terkep = mezoterkepBetolt('7.2', 'hu');
  const m = (azon) => terkep.mezok.find((x) => x.azonosito === azon);
  const kitoltott = keziKitoltes(sablon('7.2', 'hu'), ({ cellaIr, kiemel }) => {
    cellaIr(m('1').hely, 'Dr. Kitalált Kata');
    cellaIr(m('5').hely, 'kata@gmail.com');
    kiemel(m('27').nemHely, 'b');
    kiemel(m('28').igenHely, 'u');
    cellaIr(m('28').hely, 'Rövid magyarázat.');
    kiemel(m('29').igenHely, 'u');
    kiemel(m('29').nemHely, 'u');
  });
  const e = urlapBeolvas(sablon('7.2', 'hu'), kitoltott, terkep);
  assert.equal(e.valaszok['1'], 'Dr. Kitalált Kata');
  assert.equal(e.valaszok['5'], 'kata@gmail.com');
  assert.equal(e.valaszok['27'], 'NEM');
  assert.equal(e.valaszok['28'], 'IGEN\nRövid magyarázat.');
  assert.match(e.ellenorizendo['29'], /IGEN és a NEM is/);
  assert.match(e.ellenorizendo['30'], /Sem az IGEN, sem a NEM/);
  assert.equal(e.valaszok['2'], '');
  assert.ok(!e.ellenorizendo['2']);
});

test('eltolt (régebbi) 7.2: a kérdés szövege alapján talál; a kérdés nélküli mezőt megjelöli', () => {
  const terkep = mezoterkepBetolt('7.2', 'hu');
  const m5 = terkep.mezok.find((x) => x.azonosito === '5');
  const kitoltott = keziKitoltes(kitolt(sablon('7.2', 'hu'), terkep, valaszok('hu'), { datum: new Date('2026-06-01') }), ({ doc, cellaIr }) => {
    // Egy új sor a táblázat elejére: minden kérdés eggyel lejjebb kerül.
    const tbl = cella(doc.dom, m5.hely).parentNode.parentNode;
    const sorok = gyerekek(tbl, 'tr');
    tbl.insertBefore(sorok[1].cloneNode(true), sorok[1]);
    // A 6. kérdés szövegét valaki átírta: ezt nem lehet biztosan megfeleltetni.
    cellaIr({ ...terkep.mezok.find((x) => x.azonosito === '6').kerdesHely, sor: terkep.mezok.find((x) => x.azonosito === '6').kerdesHely.sor + 1 }, 'A kutatás munkacíme:');
  });
  const e = urlapBeolvas(sablon('7.2', 'hu'), kitoltott, terkep);
  assert.equal(e.valaszok['5'], 'minta.anna@tatk.elte.hu');
  assert.ok(e.eltolt.includes('5'));
  assert.match(e.ellenorizendo['6'], /nem található/);
  assert.equal(e.valaszok['27'], 'IGEN\nA kellemetlen helyzetet előzetes tájékoztatás előzi meg.');
});

test('7.4: átszámozott fejezetcímek mellett is beolvas, az eltűnt fejezetet megjelöli', () => {
  const terkep = mezoterkepBetolt('7.4', 'hu');
  const kitoltott = kitolt(sablon('7.4', 'hu'), terkep, valaszok('hu'), { datum: new Date('2026-06-01') });
  const doc = docxMegnyit(kitoltott);
  for (const t of doc.dom.getElementsByTagNameNS(W, 't')) {
    t.textContent = t.textContent.replace(/^3\. A kutatás célja/, '4. A kutatás célja').replace(/^16\. Adatkezelés költségei/, 'Költségek');
  }
  const e = urlapBeolvas(sablon('7.4', 'hu'), docxMent(doc), terkep);
  assert.equal(e.valaszok['3'], valaszok('hu')['7.4']['3']);
  assert.ok(e.ellenorizendo['15'] || e.ellenorizendo['16']);
});

test('a beolvasás eredménye a munkaanyagban megjelölve, és a döntés a dontesek.md-be kerül', async (t) => {
  const root = projekt(t);
  const kezi = keziKitoltes(sablon('7.2', 'hu'), ({ cellaIr }) => cellaIr(mezoterkepBetolt('7.2', 'hu').mezok.find((x) => x.azonosito === '1').hely, 'Dr. Kitalált Kata'));
  writeFileSync(join(root, 'keab/regi.docx'), kezi);
  const r = await wordBeolvas(root, { nyelv: 'hu', fajlok: { '7.2': 'keab/regi.docx' } });
  assert.deepEqual(r.hianyzo, ['7.4', '7.1']);
  assert.ok(r.ellenorizendo.some((e) => e.mezo === '27' && e.kerdes.startsWith('Jár-e')));
  const md = readFileSync(join(root, 'keab/kerelem.md'), 'utf8');
  assert.match(md, /## \[1\] A kérelmező \(kutatásvezető\) neve:\n(<!--[^\n]*-->\n)?Dr\. Kitalált Kata\n/);
  assert.match(md, /<!-- kutetika: ellenőrizendő: Sem az IGEN/);
  assert.match(readFileSync(join(root, 'keab/dontesek.md'), 'utf8'), /"tipus":"beolvasas"/);
});

// --- Átdolgozás ---

function teljesMunkaanyag(nyelv = 'hu') {
  const v = valaszok(nyelv);
  const reszek = [`<!-- kutetika-kerelem nyelv=${nyelv} -->`];
  for (const u of URLAPOK) {
    const terkep = mezoterkepBetolt(u, nyelv);
    reszek.push(`# ${u} ${terkep.cim}`);
    for (const m of terkep.mezok.filter(munkaanyagMezo)) reszek.push(`## [${m.azonosito}] ${m.kerdes}\n${v[u][m.azonosito]}\n`);
  }
  reszek.push(`# ${nyelv === 'hu' ? 'Tájékoztató és hozzájáruló nyilatkozat' : 'Statement of information and consent'}\nA részvétel önkéntes, a hozzájárulás bármikor visszavonható.\n`);
  return reszek.join('\n');
}

const PONTOK = `
## [1] Kutatásvezető
Állapot: javítva
Érintett: 7.2/[1], 7.2/[2]

### A bizottság szövege
Kutatásvezető csak minősített (PhD) kutató lehet.

### Mi változott
A kutatásvezető Dr. Minta Anna (7.2/[1]).

## [2] ELTE-s cím
Állapot: nem teljesíthető
Érintett: 7.2/[5]

### A bizottság szövege
ELTE-s cím megadása szükséges.

### Indoklás
A kutatásvezetőnek nincs ELTE-s címe.
`;

async function atdolgozasProjekt(t, nyelv = 'hu') {
  const root = projekt(t);
  writeFileSync(join(root, 'keab/kerelem.md'), teljesMunkaanyag(nyelv));
  const elso = await eloallit(root, options);
  takarit(t, elso);
  writeFileSync(join(root, 'keab/ertekelolap.pdf'), '%PDF-1.4 kitalált értékelőlap');
  return { root, elso };
}

test('atdolgozas-kezd: az utolsó előállítást és az értékelőlapot menti, létezőt nem ír felül', async (t) => {
  const { root, elso } = await atdolgozasProjekt(t);
  const r = await atdolgozasKezd(root, { ertekelolap: 'keab/ertekelolap.pdf', datum: '2026-06-03', azonosito: '2026_007_01', dontes: 'Átdolgozásra, visszaküldésre javasolt' });
  assert.equal(r.allapot, 'letrehozva');
  assert.equal(r.mappa, 'keab/elozmeny/2026-06-03');
  const mentett = readdirSync(join(root, r.mappa)).sort();
  for (const f of [...elso.fajlok, 'keab/kerelem.md', 'keab/bead.md', 'keab/ertekelolap.pdf']) assert.ok(mentett.includes(f.slice(5)), f);
  const s = allapotOlvas(root);
  assert.equal(s.atdolgozas.ertekelolap, 'keab/elozmeny/2026-06-03/ertekelolap.pdf');
  const atd = atdolgozasOlvas(readFileSync(join(root, 'keab/atdolgozas.md'), 'utf8'));
  assert.equal(atd.fejlec.azonosito, '2026_007_01');
  assert.equal(atd.fejlec.ertekelolap, 'keab/elozmeny/2026-06-03/ertekelolap.pdf');
  const ujra = await atdolgozasKezd(root, { ertekelolap: 'keab/ertekelolap.pdf', datum: '2026-06-03' });
  assert.equal(ujra.allapot, 'mar-letezik');
});

test('atdolgozas-kezd: előállítás nélkül a beadott fájlokat kéri, és azokat menti', async (t) => {
  const root = projekt(t);
  writeFileSync(join(root, 'keab/ertekelolap.pdf'), '%PDF-1.4');
  await assert.rejects(atdolgozasKezd(root, { ertekelolap: 'keab/ertekelolap.pdf', datum: '2026-06-03' }), /beadott/);
  const fajlok = kitoltottUrlapok(root, 'hu');
  const r = await atdolgozasKezd(root, { ertekelolap: 'keab/ertekelolap.pdf', datum: '2026-06-03', beadott: Object.values(fajlok) });
  assert.equal(r.fajlok.length, 4);
  for (const rossz of [{ datum: '2026.06.03' }, { datum: '2026-06-04', beadott: 'keab/x.docx' }]) {
    await assert.rejects(atdolgozasKezd(root, { ertekelolap: 'keab/ertekelolap.pdf', ...rossz }));
  }
});

test('az előzmény az újraelőállítás után bájtra azonos, és nem része az új beadványnak', async (t) => {
  const { root } = await atdolgozasProjekt(t);
  const r = await atdolgozasKezd(root, { ertekelolap: 'keab/ertekelolap.pdf', datum: '2026-06-03' });
  const elotte = Object.fromEntries(readdirSync(join(root, r.mappa)).map((f) => [f, readFileSync(join(root, r.mappa, f))]));
  writeFileSync(join(root, 'keab/atdolgozas.md'), readFileSync(join(root, 'keab/atdolgozas.md'), 'utf8') + PONTOK);
  const e = await eloallit(root, options);
  takarit(t, e);
  for (const [f, b] of Object.entries(elotte)) assert.deepEqual(readFileSync(join(root, r.mappa, f)), b, f);
  assert.ok(!e.kifogasok.some((k) => k.azonosito.startsWith('formai:regi-kimenet')));
  assert.ok(!e.fajlok.some((f) => f.startsWith('keab/elozmeny/')));
});

test('atdolgozas.md: pontok, állapotok, hibás állapot és ismeretlen alcím olvasható hibával', () => {
  const atd = atdolgozasOlvas(`# Átdolgozás\nElőző eljárás: X\n\n# Pontok\n${PONTOK}\n## [3] Harmadik\nÁllapot: kész\n\n### Megjegyzés\nvalami\n`);
  assert.equal(atd.pontok.length, 3);
  assert.equal(atd.pontok[0].allapot, 'javitva');
  assert.equal(atd.pontok[0].valtozas, 'A kutatásvezető Dr. Minta Anna (7.2/[1]).');
  assert.equal(atd.pontok[1].allapot, 'nem-teljesitheto');
  assert.equal(atd.pontok[1].erintett, '7.2/[5]');
  assert.ok(atd.hibak.some((h) => h.includes('[3]') && h.includes('kész')));
  assert.ok(atd.hibak.some((h) => h.includes('Megjegyzés')));
});

test('nyitott pont, hiányzó változás és indoklás formai kifogás; a válaszlevél minden pontot tartalmaz', async (t) => {
  const { root } = await atdolgozasProjekt(t);
  await atdolgozasKezd(root, { ertekelolap: 'keab/ertekelolap.pdf', datum: '2026-06-03', azonosito: '2026_007_01' });
  const pontok = `${PONTOK}\n## [3] Kérdőív\nÁllapot: nyitott\n\n### A bizottság szövege\nKérdőív hiányzik.\n\n## [4] Függetlenség\nÁllapot: javítva\n\n### A bizottság szövege\nFüggetlenség.\n\n## [5] Hozzájárulás\nÁllapot: nem teljesíthető\n\n### A bizottság szövege\nHozzájárulás.\n`;
  writeFileSync(join(root, 'keab/atdolgozas.md'), readFileSync(join(root, 'keab/atdolgozas.md'), 'utf8') + pontok);
  const e = await eloallit(root, options);
  takarit(t, e);
  const ids = e.kifogasok.map((k) => k.azonosito);
  for (const id of ['formai:atdolgozas:3:nyitott', 'formai:atdolgozas:4:valtozas', 'formai:atdolgozas:5:indoklas']) assert.ok(ids.includes(id), id);
  assert.ok(!ids.some((id) => /atdolgozas:[12]:/.test(id)));
  assert.equal(e.fajlok.length, 5);
  const level = readFileSync(join(root, 'keab/valaszlevel.md'), 'utf8');
  for (const s of ['2026_007_01', '1. Kutatásvezető', 'Állapot: javítva', 'Állapot: nem teljesítettük', 'Indoklás: A kutatásvezetőnek nincs ELTE-s címe.', '3. Kérdőív', 'Állapot: nyitott']) assert.ok(level.includes(s), s);
  const word = e.fajlok.find((f) => f.includes('Válaszlevél'));
  assert.match(word, /^keab\/Válaszlevél a Bizottság értékelésére \(MINTA_20260917\)\.docx$/);
  const bead = readFileSync(join(root, 'keab/bead.md'), 'utf8');
  for (const s of ['## Átdolgozás', '2026_007_01', word, 'KEAB titkárságát']) assert.ok(bead.includes(s), s);
});

test('angol beadványnál a válaszlevél angol', () => {
  const szoveg = valaszlevelSzoveg(atdolgozasOlvas(`# Átdolgozás\nElőző eljárás: 2026_007_01\n\n# Kísérőszöveg\nDear Committee,\n\n# Pontok\n${PONTOK}`), 'en');
  for (const s of ['Response to the evaluation', 'Previous procedure: 2026_007_01', 'Dear Committee,', 'Status: addressed', 'Status: not addressed', 'Reason:']) assert.ok(szoveg.includes(s), s);
});

test('a válaszlevél és az atdolgozas.md módosítása érvényteleníti a „mehet”-et; a visszaküldés módja a bead.md-be kerül', async (t) => {
  const { root } = await atdolgozasProjekt(t);
  await atdolgozasKezd(root, { ertekelolap: 'keab/ertekelolap.pdf', datum: '2026-06-03', visszakuldes: 'válaszként a KEAB levelére' });
  writeFileSync(join(root, 'keab/atdolgozas.md'), readFileSync(join(root, 'keab/atdolgozas.md'), 'utf8') + PONTOK.replace('Állapot: nem teljesíthető', 'Állapot: javítva').replace('### Indoklás', '### Mi változott'));
  const e = await eloallit(root, options);
  takarit(t, e);
  assert.deepEqual(e.kifogasok, []);
  const kesz = await biralatRogzit(root, { token: e.token, keres: e.keres.azonosito, asszisztens: e.keres.asszisztens, mod: e.keres.mod, kifogasok: [] });
  assert.equal(kesz.mehet, true);
  assert.match(readFileSync(join(root, 'keab/bead.md'), 'utf8'), /Visszaküldés: válaszként a KEAB levelére/);
  const word = e.fajlok.find((f) => f.includes('Válaszlevél'));
  writeFileSync(join(root, word), Buffer.concat([readFileSync(join(root, word)), Buffer.from('x')]));
  assert.equal((await allapot(root)).mehet, false);
  writeFileSync(join(root, word), readFileSync(join(root, word)).subarray(0, -1));
  assert.equal((await allapot(root)).mehet, true);
  writeFileSync(join(root, 'keab/atdolgozas.md'), `${readFileSync(join(root, 'keab/atdolgozas.md'), 'utf8')}\n`);
  assert.equal((await allapot(root)).mehet, false);
});

test('átdolgozáskor a bírálati csomagban az értékelőlap és a válaszlevél is ott van, a döntések nem', async (t) => {
  const { root } = await atdolgozasProjekt(t);
  await atdolgozasKezd(root, { ertekelolap: 'keab/ertekelolap.pdf', datum: '2026-06-03' });
  writeFileSync(join(root, 'keab/atdolgozas.md'), readFileSync(join(root, 'keab/atdolgozas.md'), 'utf8') + PONTOK);
  for (const r of [await eloallit(root, options), await munkaanyagBiralat(root, options)]) {
    takarit(t, r);
    const fajlok = Object.keys(r.keres.fajlok);
    assert.ok(fajlok.includes('bizottsag/ertekelolap.pdf'));
    assert.ok(fajlok.includes('bizottsag/valaszlevel.md'));
    assert.ok(!fajlok.some((f) => /dontesek|atdolgozas\.md|AGENTS/.test(f)));
    assert.match(r.keres.utasitas, /bizottsag\/ mappában/);
    assert.match(readFileSync(join(r.keres.mappa, 'bizottsag/valaszlevel.md'), 'utf8'), /Kutatásvezető csak minősített/);
  }
});

test('átdolgozás nélkül a csomagban nincs bizottsag/ mappa, és az utasítás sem említi', async (t) => {
  const root = projekt(t);
  writeFileSync(join(root, 'keab/kerelem.md'), teljesMunkaanyag());
  const r = await eloallit(root, options);
  takarit(t, r);
  assert.equal(r.fajlok.length, 4);
  assert.ok(!Object.keys(r.keres.fajlok).some((f) => f.startsWith('bizottsag/')));
  assert.doesNotMatch(r.keres.utasitas, /bizottsag\//);
});

test('megkezdés nélküli atdolgozas.md-re formai kifogás jön', async (t) => {
  const root = projekt(t);
  writeFileSync(join(root, 'keab/kerelem.md'), teljesMunkaanyag());
  writeFileSync(join(root, 'keab/atdolgozas.md'), `# Átdolgozás\n\n# Pontok\n${PONTOK}`);
  const r = await eloallit(root, options);
  takarit(t, r);
  assert.ok(r.kifogasok.some((k) => k.azonosito === 'formai:atdolgozas:nincs-megkezdve'));
  assert.ok(!Object.keys(r.keres.fajlok).includes('bizottsag/ertekelolap.pdf'));
});

test('az előzmény mappába semmi más nem írhat', async (t) => {
  const { ir } = await import('../src/munkafolyamat.js');
  const root = projekt(t);
  assert.throws(() => ir(root, 'keab/elozmeny/2026-06-03/x.md', 'x'), /nem módosítható/);
  assert.ok(!existsSync(join(root, 'keab/elozmeny')));
});

test('a második AI-szolgáltatónak szóló tájékoztatás átdolgozáskor az értékelőlapot is említi', () => {
  assert.match(ADATKOZLES, /értékelőlap/);
  assert.match(tajekoztatas('codex'), /értékelőlap/);
});

test('a kitalált próbakérelem (cégplatform, gmailes cím) beolvasható, és a gépi réteg jelzi az ELTE-s címet', async (t) => {
  const root = projekt(t);
  writeFileSync(join(root, 'keab/kerelem.md'), readFileSync(new URL('./fixtures/atdolgozas-proba/kerelem.md', import.meta.url)));
  const draft = beolvas(readFileSync(join(root, 'keab/kerelem.md'), 'utf8'));
  assert.deepEqual(draft.hibak, []);
  const r = await eloallit(root, options);
  takarit(t, r);
  assert.deepEqual(r.kifogasok.map((k) => k.azonosito), ['formai:elte-email:7.2/5']);
  assert.match(readFileSync(new URL('./fixtures/atdolgozas-proba/ertekelolap.txt', import.meta.url), 'utf8'), /KITALÁLT/);
});

test('a bíráló szöveges másolatában látszik a kijelölt IGEN/NEM és az aláhúzás; az ujjlenyomat nem változik', () => {
  const terkep = mezoterkepBetolt('7.2', 'hu');
  const m = (azon) => terkep.mezok.find((x) => x.azonosito === azon);
  const eszkozzel = kitolt(sablon('7.2', 'hu'), terkep, valaszok('hu'), { datum: new Date('2026-06-01') });
  const jelolt = szerkezetesSzoveg(docxMegnyit(eszkozzel).dom, { jeloles: true });
  assert.equal(jelolt.match(/\[kijelölve\] NEM/g).length, 7);
  assert.equal(jelolt.match(/\[kijelölve\] IGEN/g).length, 1);
  assert.doesNotMatch(szerkezetesSzoveg(docxMegnyit(eszkozzel).dom), /\[kijelölve\]|\[aláhúzva/);
  for (const u of URLAPOK) assert.doesNotMatch(szerkezetesSzoveg(docxMegnyit(sablon(u, 'hu')).dom, { jeloles: true }), /\[kijelölve\]|\[aláhúzva/, u);
  const kezi = keziKitoltes(sablon('7.2', 'hu'), ({ kiemel }) => { kiemel(m('27').nemHely, 'b'); kiemel(m('14').kerdesHely, 'u'); });
  const kezzel = szerkezetesSzoveg(docxMegnyit(kezi).dom, { jeloles: true });
  assert.equal(kezzel.match(/\[kijelölve\]/g).length, 1);
  assert.match(kezzel, /\[aláhúzva: A beleegyezés/);
  assert.equal(ujjlenyomat(sablon('7.2', 'hu'), 'docx'), terkep.ujjlenyomat);
});

test('a bírálati csomag szöveges másolata a kijelölést is mutatja', async (t) => {
  const root = projekt(t);
  writeFileSync(join(root, 'keab/kerelem.md'), teljesMunkaanyag());
  const r = await eloallit(root, options);
  takarit(t, r);
  const nev = Object.keys(r.keres.fajlok).find((f) => f.startsWith('beadvany/7.2') && f.endsWith('.docx.txt'));
  assert.match(readFileSync(join(r.keres.mappa, nev), 'utf8'), /\[kijelölve\] IGEN/);
});
