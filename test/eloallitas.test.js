import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { eloallit } from '../src/eloallitas.js';
import { biralatRogzit } from '../src/biralat.js';
import { allapot } from '../src/ellenorzes.js';
import { munkaanyagMezo } from '../src/kerelem.js';
import { mezoterkepBetolt, URLAPOK } from '../src/mezoterkep.js';
import { docxMegnyit, szerkezetesSzoveg } from '../src/docx.js';

function teljesMunkaanyag() {
  const reszek = ['<!-- kutetika-kerelem nyelv=hu -->'];
  for (const u of URLAPOK) {
    const terkep = mezoterkepBetolt(u, 'hu');
    reszek.push(`# ${u} ${terkep.cim}`);
    for (const m of terkep.mezok.filter(munkaanyagMezo)) {
      let valasz = 'A mintakutatás részletes válasza.';
      if (m.szoszam?.min) valasz = Array(m.szoszam.min).fill('mintaszó').join(' ');
      if (m.tipus === 'igen-nem') valasz = 'NEM';
      if (m.tipus === 'megerosites') valasz = 'igen';
      if (m.valasztas) valasz = m.valasztas[0];
      if (m.tipus === 'sorok') valasz = 'Minta Anna | ABC123 | kutatásvezető';
      if (u === '7.2' && m.azonosito === '1') valasz = 'Dr. Minta Anna';
      if (m.ellenorzes === 'elte-email') valasz = 'minta.anna@tatk.elte.hu';
      reszek.push(`## [${m.azonosito}] ${m.kerdes}\n${valasz}\n`);
    }
  }
  reszek.push('# Tájékoztató és hozzájáruló nyilatkozat\nA részvétel önkéntes. A hozzájárulás visszavonható. Cél: mintakutatás. Kezelt adat: kérdőív. Kapcsolat: minta@example.invalid.\n');
  return reszek.join('\n');
}

test('teljes nyilvános folyamat: Word → függő átadás → bírálat → mehet → bájtváltozás érvénytelenít', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'kutetika-e2e-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'keab'));
  writeFileSync(join(root, 'keab/kerelem.md'), teljesMunkaanyag());
  let frissitesek = 0;
  const r = await eloallit(root, {
    asszisztens: 'claude', subagent: true, elerheto: [], mellekletek: [], datum: '2026-09-17T12:00:00Z',
    frissitesEllenoriz: async () => { frissitesek++; return { allapot: 'egyezik', figyelmeztetesek: [] }; },
  });
  if (r.keres?.mappa) t.after(() => rmSync(r.keres.mappa, { recursive: true, force: true }));
  assert.equal(frissitesek, 1);
  assert.equal(r.fajlok.length, 4);
  for (const f of r.fajlok) assert.ok(docxMegnyit(readFileSync(join(root, f))).dom);
  assert.equal(r.mehet, false);
  assert.equal(r.allapot, 'biralatra-var');
  assert.equal(r.keres.mod, 'subagent');
  assert.deepEqual(r.kifogasok, []);
  const info = r.fajlok.find((f) => f.includes('Tájékoztató'));
  assert.match(szerkezetesSzoveg(docxMegnyit(readFileSync(join(root, info))).dom), /önkéntes.*visszavonható/);
  assert.equal((await allapot(root)).mehet, false);
  const kesz = await biralatRogzit(root, { token: r.token, keres: r.keres.azonosito, asszisztens: 'claude', mod: 'subagent', kifogasok: [] });
  assert.equal(kesz.mehet, true);
  assert.match(readFileSync(join(root, 'keab/bead.md'), 'utf8'), /Állapot: mehet/);
  const f = join(root, r.fajlok[0]);
  writeFileSync(f, Buffer.concat([readFileSync(f), Buffer.from(' ')]));
  const stale = await allapot(root);
  assert.equal(stale.mehet, false);
  assert.equal(stale.allapot, 'ervenytelen');
  assert.doesNotMatch(readFileSync(join(root, 'keab/bead.md'), 'utf8'), /Állapot: mehet/);
});
