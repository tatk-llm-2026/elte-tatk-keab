import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { eloallit, munkaanyagBiralat } from '../src/eloallitas.js';
import { biralatFolytat, biralatRogzit, biraloValaszt, elerhetoAsszisztensek, engedelyRogzit, kulsoParancs } from '../src/biralat.js';
import { allapot } from '../src/ellenorzes.js';
import { allapotOlvas, ir, olvas } from '../src/munkafolyamat.js';

function projekt(t) {
  const root = mkdtempSync(join(tmpdir(), 'kutetika-bir-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'keab'));
  writeFileSync(join(root, 'keab/kerelem.md'), '<!-- kutetika-kerelem nyelv=hu -->\n# Tájékoztató és hozzájáruló nyilatkozat\nVálasz.\n');
  return root;
}

const opcio = { frissitesEllenoriz: async () => ({ allapot: 'egyezik', figyelmeztetesek: [] }) };
const kifogas = { azonosito: 'x', sulyossag: 'javitando', hely: 'kerelem.md 7.2/[1]', problema: 'rövid', szabalyzat: null };
const eredmeny = (k, kifogasok = []) => ({ token: k.token, keres: k.azonosito, asszisztens: k.asszisztens, mod: k.mod, kifogasok });
const takarit = (t, r) => { if (r.keres?.mappa) t.after(() => rmSync(r.keres.mappa, { recursive: true, force: true })); };

test('bírálóválasztás: külső preferencia, engedélykérés, elutasítás, subagent, új beszélgetés', () => {
  assert.equal(biraloValaszt({ asszisztens: 'claude', elerheto: [], subagent: true }).mod, 'subagent');
  assert.equal(biraloValaszt({ asszisztens: 'claude', elerheto: [] }).mod, 'uj-beszelgetes');
  assert.equal(biraloValaszt({ asszisztens: 'claude', elerheto: ['codex'], subagent: true, engedelyek: { codex: true }, kulsoFuttato: true }).mod, 'kulso');
  assert.equal(biraloValaszt({ asszisztens: 'codex', elerheto: ['claude'], engedelyek: { claude: true }, kulsoFuttato: true }).asszisztens, 'claude');
  assert.equal(biraloValaszt({ asszisztens: 'copilot', elerheto: ['claude'], engedelyek: { claude: false }, kulsoFuttato: true }).mod, 'uj-beszelgetes');
  assert.equal(biraloValaszt({ asszisztens: 'copilot', elerheto: ['claude', 'codex'], engedelyek: { codex: false }, kulsoFuttato: true }).asszisztens, 'claude');
  // Elkülönített futtató nélkül nem kér engedélyt, a saját asszisztens bírál.
  assert.equal(biraloValaszt({ asszisztens: 'claude', elerheto: ['codex'], subagent: true }).mod, 'subagent');
  assert.equal(biraloValaszt({ asszisztens: 'claude', elerheto: ['codex'], engedelyek: { codex: true } }).mod, 'uj-beszelgetes');
  const ker = biraloValaszt({ asszisztens: 'claude', elerheto: ['codex'], kulsoFuttato: true });
  assert.equal(ker.mod, 'engedelyre-var');
  assert.match(ker.tajekoztatas, /második AI-szolgáltató/);
  assert.throws(() => biraloValaszt({ asszisztens: 'ismeretlen' }));
});

test('PATH-felderítés nem indít programot; kizárólag engedélyezett parancsok', (t) => {
  const root = projekt(t);
  const f = join(root, process.platform === 'win32' ? 'codex.exe' : 'codex');
  writeFileSync(f, 'not a program');
  chmodSync(f, 0o700);
  assert.deepEqual(elerhetoAsszisztensek({ PATH: root }), ['codex']);
  assert.deepEqual(elerhetoAsszisztensek({ PATH: '' }), []);
  writeFileSync(join(root, 'claude.cmd'), '@echo off');
  assert.deepEqual(elerhetoAsszisztensek({ Path: root, PATHEXT: '.EXE;.CMD' }, 'win32'), ['claude']);
  assert.ok(kulsoParancs('codex').argumentumok.includes('read-only'));
  assert.ok(kulsoParancs('claude').argumentumok.includes('Read'));
  assert.throws(() => kulsoParancs('copilot'));
});

test('engedély nélkül nincs staging vagy szolgáltatói futtatás; az eredmény nem fogadható be', async (t) => {
  const root = projekt(t);
  let hivva = 0;
  const r = await eloallit(root, { asszisztens: 'claude', elerheto: ['codex'], mellekletek: [], ...opcio, elkulonitettFuttato: async () => { hivva++; } });
  assert.equal(r.allapot, 'engedelyre-var');
  assert.equal(r.mehet, false);
  assert.equal(r.keres.mappa, undefined);
  assert.equal(hivva, 0);
  await assert.rejects(biralatRogzit(root, eredmeny(r.keres)));
});

test('engedéllyel, de elkülönített futtató nélkül nem akad el: a saját asszisztens bírál', async (t) => {
  const root = projekt(t);
  await engedelyRogzit(root, { asszisztens: 'codex', engedely: true });
  const r = await eloallit(root, { asszisztens: 'claude', elerheto: ['codex'], mellekletek: [], ...opcio });
  takarit(t, r);
  assert.equal(r.keres.mod, 'uj-beszelgetes');
  assert.equal(r.keres.asszisztens, 'claude');
  assert.equal(r.keres.parancs, undefined);
  const kesz = await biralatRogzit(root, eredmeny(r.keres));
  assert.equal(kesz.biralat.allapot, 'kesz');
});

test('külső mock csak kész Wordöt, kari anyagot, bírálói skillt kap; nem örököl projektet vagy történetet', async (t) => {
  const root = projekt(t);
  await engedelyRogzit(root, { asszisztens: 'codex', engedely: true });
  writeFileSync(join(root, 'AGENTS.md'), 'TITKOS-UTASITAS');
  mkdirSync(join(root, 'data'));
  writeFileSync(join(root, 'data/valaszok.txt'), 'NYERS-ADAT');
  let hivva = 0;
  const futtato = async (k) => {
    hivva++;
    assert.equal(k.elkulonites.orokoltKornyezet, false);
    assert.ok(!k.fajlok['beadvany/kerelem.md']);
    assert.equal(Object.keys(k.fajlok).filter((f) => f.startsWith('beadvany/')).length, 4);
    for (const nev of Object.keys(k.fajlok)) {
      assert.match(nev, /^(beadvany|kari|biralo)\//);
      assert.doesNotMatch(nev, /AGENTS|dontesek|data\/|\.git/);
      assert.doesNotMatch(readFileSync(join(k.mappa, nev)).toString(), /TITKOS-UTASITAS|NYERS-ADAT/);
    }
    return eredmeny(k, [kifogas]);
  };
  const r = await eloallit(root, { asszisztens: 'claude', elerheto: ['codex'], mellekletek: [], ...opcio, elkulonitettFuttato: futtato });
  takarit(t, r);
  assert.equal(hivva, 1);
  assert.equal(r.biralat.allapot, 'kesz');
  assert.ok(r.kifogasok.some((k) => k.azonosito === 'biralat:x'));
  assert.equal(r.mehet, false);
});

test('szolgáltatói engedély és elutasítás egyszer naplózott; megváltoztatható', async (t) => {
  const root = projekt(t);
  await engedelyRogzit(root, { asszisztens: 'codex', engedely: false });
  const elso = readFileSync(join(root, 'keab/dontesek.md'), 'utf8');
  await engedelyRogzit(root, { asszisztens: 'codex', engedely: false });
  assert.equal(readFileSync(join(root, 'keab/dontesek.md'), 'utf8'), elso);
  assert.equal(allapotOlvas(root).engedelyek.codex, false);
  const r = await eloallit(root, { asszisztens: 'claude', elerheto: ['codex'], subagent: true, mellekletek: [], ...opcio });
  takarit(t, r);
  assert.equal(r.keres.mod, 'subagent');
  await engedelyRogzit(root, { asszisztens: 'codex', engedely: true });
  assert.equal(allapotOlvas(root).engedelyek.codex, true);
  assert.equal(readFileSync(join(root, 'keab/dontesek.md'), 'utf8').split('kulso-szolgaltatoi-engedely').length - 1, 2);
});

for (const mod of ['subagent', 'uj-beszelgetes']) test(`${mod}: korai bírálat sohasem mehet; csak kész eredményt fogad`, async (t) => {
  const root = projekt(t);
  const r = await munkaanyagBiralat(root, { asszisztens: 'claude', subagent: mod === 'subagent', elerheto: [], mellekletek: [], ...opcio });
  takarit(t, r);
  assert.ok(r.keres.fajlok['beadvany/kerelem.md']);
  assert.equal(r.mehet, false);
  await assert.rejects(biralatRogzit(root, { ...eredmeny(r.keres), kifogasok: undefined }));
  const kesz = await biralatRogzit(root, eredmeny(r.keres));
  assert.equal(kesz.allapot, 'munkaanyag-biralva');
  assert.equal(kesz.mehet, false);
  await assert.rejects(biralatRogzit(root, eredmeny(r.keres)));
});

test('új átadás elutasítja a régi kérés eredményét; módosult munkaanyagot nem fogad', async (t) => {
  const root = projekt(t);
  const r = await eloallit(root, { asszisztens: 'claude', elerheto: [], mellekletek: [], ...opcio });
  takarit(t, r);
  const masik = await biralatFolytat(root, { asszisztens: 'claude', elerheto: [] });
  takarit(t, masik);
  await assert.rejects(biralatRogzit(root, eredmeny(r.keres)));
  ir(root, 'keab/kerelem.md', olvas(root, 'keab/kerelem.md') + 'módosítás');
  await assert.rejects(biralatFolytat(root, { asszisztens: 'claude', elerheto: [] }));
  await assert.rejects(biralatRogzit(root, eredmeny(masik.keres)));
  assert.equal((await allapot(root)).mehet, false);
});

for (const hiba of ['kivetel', 'elavult', 'hibas']) test(`sikertelen külső futtató: ${hiba}`, async (t) => {
  const root = projekt(t);
  await engedelyRogzit(root, { asszisztens: 'codex', engedely: true });
  const r = await eloallit(root, { asszisztens: 'claude', elerheto: ['codex'], mellekletek: [], ...opcio, elkulonitettFuttato: async (k) => {
    if (hiba === 'kivetel') throw new Error('provider failed');
    if (hiba === 'elavult') return { ...eredmeny(k), token: 'stale' };
    return {};
  } });
  takarit(t, r);
  assert.equal(r.biralat.allapot, 'sikertelen-biralat');
  assert.equal(r.mehet, false);
});

test('megszakadt művelet zárolása nem blokkol; a Word ~$ ideiglenes fájlja nem számít', async (t) => {
  const { zarol, wordLista } = await import('../src/munkafolyamat.js');
  const root = projekt(t);
  mkdirSync(join(root, 'keab'), { recursive: true });
  writeFileSync(join(root, 'keab/.folyamat-zar'), '999999999');
  assert.equal(await zarol(root, async () => 'lefutott'), 'lefutott');
  writeFileSync(join(root, 'keab/.folyamat-zar'), String(process.pid));
  await assert.rejects(zarol(root, async () => 'x'), /még fut/);
  writeFileSync(join(root, 'keab/~$KERELEM.docx'), 'zár');
  assert.ok(!wordLista(root).some((f) => f.includes('~$')));
});
