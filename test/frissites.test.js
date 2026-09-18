import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { frissitesEllenoriz } from '../src/frissites.js';
import { KAR_OLDAL, KARI_DOKUMENTUMOK, linkekKeresese } from '../src/kar.js';
import { csomagUjjlenyomatok } from '../src/jegyzek.js';
import { docxMegnyit, docxMent, W } from '../src/docx.js';
import { ujjlenyomat } from '../src/ujjlenyomat.js';
import { figyeles, hibajegyAdatok, hibajegyBiztosit } from '../scripts/figyeles.js';

const oldal = readFileSync('test/fixtures/kar-oldal.html', 'utf8');
const linkek = linkekKeresese(oldal);
const jegyzek = JSON.parse(readFileSync('dokumentumok/jegyzek.json', 'utf8'));
const eredeti = Object.fromEntries(KARI_DOKUMENTUMOK.map((d) => [d.azonosito, readFileSync(join('dokumentumok', d.fajl))]));
const kezdet = Date.parse('2026-09-17T10:00:00Z');
const nap = 86_400_000;

function projekt(t, verzio = jegyzek.kutetikaVerzio) {
  const gyoker = mkdtempSync(join(tmpdir(), 'kutetika-frissites-'));
  t.after(() => rmSync(gyoker, { recursive: true, force: true }));
  mkdirSync(join(gyoker, 'keab/.eszkoz', 'dokumentumok'), { recursive: true });
  writeFileSync(join(gyoker, 'keab/.eszkoz', 'dokumentumok', 'jegyzek.json'), JSON.stringify({ ...jegyzek, kutetikaVerzio: verzio }));
  writeFileSync(join(gyoker, 'keab/.eszkoz', 'package.json'), JSON.stringify({ name: 'kutetika', version: verzio }));
  return gyoker;
}

function modosit(id) {
  if (id.startsWith('szabalyzat')) return Buffer.concat([eredeti[id], Buffer.from('\nValtozas\n')]);
  const doc = docxMegnyit(eredeti[id]);
  doc.dom.getElementsByTagNameNS(W, 't')[0].textContent += ' módosítás';
  return docxMent(doc);
}

function lenyomatok(dokumentumok) {
  return Object.fromEntries(KARI_DOKUMENTUMOK.map((d) => [d.azonosito, ujjlenyomat(dokumentumok[d.azonosito], d.tipus)]));
}

function kiadas(version, dokumentumok, extra = {}) {
  return { version, kutetika: { dokumentumok }, ...extra };
}

function halozat({ html = oldal, dokumentumok = eredeti, npm = { versions: {} }, status = 200, hibaCim, hiba } = {}) {
  const hivasok = [];
  return {
    hivasok,
    fetch: async (cim, options) => {
      hivasok.push(cim);
      assert.ok(options.signal instanceof AbortSignal);
      if (hiba && (!hibaCim || cim === hibaCim)) throw hiba;
      if (cim === KAR_OLDAL) return new Response(html);
      if (cim === 'https://registry.npmjs.org/kutetika') {
        assert.equal(options.headers.Accept, 'application/json');
        return new Response(typeof npm === 'string' ? npm : JSON.stringify(npm), { status });
      }
      const id = Object.keys(linkek).find((id) => linkek[id] === cim);
      assert.ok(id, `Váratlan hálózati cím: ${cim}`);
      return new Response(dokumentumok[id]);
    },
  };
}

async function ellenoriz(gyoker, net, options = {}) {
  const eredmeny = await frissitesEllenoriz(gyoker, { fetch: net.fetch, now: () => kezdet, ...options });
  assert.equal(eredmeny.folytathato, true);
  return eredmeny;
}

test('a mentett oldalon mind a nyolc dokumentum egyezik, nincs npm-hívás vagy üzenet', async (t) => {
  const net = halozat();
  const r = await ellenoriz(projekt(t), net);
  assert.equal(r.allapot, 'egyezik');
  assert.deepEqual(r.figyelmeztetesek, []);
  assert.deepEqual(r.elteresek, []);
  assert.deepEqual(r.kariUjjlenyomatok, csomagUjjlenyomatok(jegyzek));
  assert.equal(net.hivasok.length, 9);
  assert.equal(r.ellenorizve, new Date(kezdet).toISOString());
});

for (const { azonosito } of KARI_DOKUMENTUMOK) {
  test(`${azonosito}: egyetlen módosítás is eltérés, nincs még illő kiadás`, async (t) => {
    const dokumentumok = { ...eredeti, [azonosito]: modosit(azonosito) };
    const r = await ellenoriz(projekt(t), halozat({ dokumentumok }));
    assert.equal(r.allapot, 'nincs-illo-verzio');
    assert.deepEqual(r.elteresek.map((d) => d.azonosito), [azonosito]);
    assert.match(r.figyelmeztetesek[0], /még nincs/);
    assert.ok(r.figyelmeztetesek[0].includes(azonosito));
  });
}

test('újramentett Word nem jelez változást', async (t) => {
  const dokumentumok = { ...eredeti, '7.2-hu': docxMent(docxMegnyit(eredeti['7.2-hu'])) };
  assert.equal((await ellenoriz(projekt(t), halozat({ dokumentumok }))).allapot, 'egyezik');
});

test('a legnagyobb stabil, nem elavult, mind a nyolc dokumentumhoz illő kiadást választja', async (t) => {
  const dokumentumok = { ...eredeti, '7.1-en': modosit('7.1-en') };
  const uj = lenyomatok(dokumentumok);
  const hianyos = { ...uj };
  delete hianyos['szabalyzat-en'];
  const versions = {
    '2.9.0': kiadas('2.9.0', uj),
    '2.10.0': kiadas('2.10.0', uj),
    '2.10.1': kiadas('2.10.1', uj),
    '10.0.0': kiadas('10.0.0', uj),
    '3.0.0': kiadas('3.0.0', uj),
    '11.0.0': kiadas('11.0.0', csomagUjjlenyomatok(jegyzek)),
    '12.0.0-beta.1': kiadas('12.0.0-beta.1', uj),
    '13.0.0': kiadas('13.0.0', uj, { deprecated: 'Hibás kiadás' }),
    '14.0.0': kiadas('14.0.0', hianyos),
    '15.0.0': kiadas('15.0.0', { ...uj, '7.5-hu': uj['7.1-hu'] }),
    '16.0.0': kiadas('16.0.1', uj),
    '017.0.0': kiadas('017.0.0', uj),
    '18.0': kiadas('18.0', uj),
    '19.0.0': null,
  };
  const net = halozat({ dokumentumok, npm: { versions, 'dist-tags': { latest: '11.0.0' } } });
  const r = await ellenoriz(projekt(t), net);
  assert.equal(r.allapot, 'frissites-elerheto');
  assert.equal(r.ujVerzio, '10.0.0');
  assert.match(r.figyelmeztetesek[0], /10\.0\.0/);
  assert.equal(net.hivasok.length, 10);
});

test('a patch és minor verziót számszerűen rendezi, a build-metaadat megengedett', async (t) => {
  const dokumentumok = { ...eredeti, '7.4-hu': modosit('7.4-hu') };
  const uj = lenyomatok(dokumentumok);
  const versions = Object.fromEntries(['2.9.99', '2.10.9', '2.10.10+build.1', '2.10.10-beta'].map((v) => [v, kiadas(v, uj)]));
  assert.equal((await ellenoriz(projekt(t), halozat({ dokumentumok, npm: { versions } }))).ujVerzio, '2.10.10+build.1');
});

test('régebbi vagy azonos verziót nem ajánl frissítésként', async (t) => {
  const dokumentumok = { ...eredeti, '7.2-hu': modosit('7.2-hu') };
  const uj = lenyomatok(dokumentumok);
  const versions = { '1.0.0': kiadas('1.0.0', uj), '2.0.0': kiadas('2.0.0', uj) };
  const r = await ellenoriz(projekt(t, '2.0.0'), halozat({ dokumentumok, npm: { versions } }));
  assert.equal(r.allapot, 'nincs-illo-verzio');
  assert.equal((await ellenoriz(projekt(t, '1.5.0'), halozat({ dokumentumok, npm: { versions } }))).ujVerzio, '2.0.0');
});

test('az npm 404 még nem kiadott csomagot jelent', async (t) => {
  const dokumentumok = { ...eredeti, '7.1-en': modosit('7.1-en') };
  assert.equal((await ellenoriz(projekt(t), halozat({ dokumentumok, status: 404 }))).allapot, 'nincs-illo-verzio');
});

for (const [nev, options, szakasz] of [
  ['nincs internet', { hiba: new Error('offline') }, 'kari-oldal'],
  ['hiányzó link', { html: '<html></html>' }, 'kari-linkek'],
  ['hibás link', { html: '<a href="http://[">x</a>' }, 'kari-linkek'],
  ['idegen dokumentumcím', { html: oldal.replaceAll('href="https://tatk.elte.hu/dstore/', 'href="https://example.invalid/dstore/') }, 'kari-linkek'],
  ['dokumentumletöltési hiba', { hiba: new Error('HTTP 503'), hibaCim: linkek['7.4-en'] }, 'kari-dokumentumok'],
  ['hibás Word', { dokumentumok: { ...eredeti, '7.2-en': Buffer.from('nem Word') } }, 'kari-dokumentumok'],
  ['PDF helyett hibaoldal', { dokumentumok: { ...eredeti, 'szabalyzat-en': Buffer.from('<html>hiba</html>') } }, 'kari-dokumentumok'],
]) {
  test(`${nev}: figyelmeztet, nem dob hibát`, async (t) => {
    const net = halozat(options);
    const r = await ellenoriz(projekt(t), net);
    if (nev === 'idegen dokumentumcím') {
      assert.ok(Object.values(linkekKeresese(options.html)).every((cim) => new URL(cim).hostname === 'example.invalid'));
      assert.deepEqual(net.hivasok, [KAR_OLDAL]);
      assert.ok(net.hivasok.every((cim) => new URL(cim).hostname === 'tatk.elte.hu'));
    }
    assert.equal(r.allapot, 'nem-ellenorizheto');
    assert.equal(r.hiba.szakasz, szakasz);
    assert.match(r.figyelmeztetesek[0], /munka folytatható/);
  });
}

for (const npmOptions of [{ status: 503 }, { npm: '{hibas' }, { npm: {} }, { npm: { versions: [] } }, { hiba: new Error('offline npm'), hibaCim: 'https://registry.npmjs.org/kutetika' }]) {
  test(`npm-hiba nem állítja, hogy nincs kiadás: ${JSON.stringify(npmOptions)}`, async (t) => {
    const dokumentumok = { ...eredeti, '7.4-en': modosit('7.4-en') };
    const r = await ellenoriz(projekt(t), halozat({ dokumentumok, ...npmOptions }));
    assert.equal(r.allapot, 'nem-ellenorizheto');
    assert.equal(r.hiba.szakasz, 'npm');
    assert.equal(r.elteresek[0].azonosito, '7.4-en');
  });
}

test('az időkorlát hálózati figyelmeztetéssé alakul', async (t) => {
  const net = { fetch: async (_cim, { signal }) => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    signal.throwIfAborted();
  } };
  const r = await ellenoriz(projekt(t), net, { timeoutMs: 1 });
  assert.equal(r.allapot, 'nem-ellenorizheto');
  assert.equal(r.hiba.szakasz, 'kari-oldal');
});

test('egy napig nincs második letöltés; pontosan egy napnál újra ellenőriz', async (t) => {
  const gyoker = projekt(t);
  const net = halozat();
  await ellenoriz(gyoker, net);
  const r = await ellenoriz(gyoker, net, { now: () => kezdet + nap - 1 });
  assert.equal(r.gyorsitotar, true);
  assert.equal(net.hivasok.length, 9);
  assert.equal((await ellenoriz(gyoker, net, { now: () => kezdet + nap })).gyorsitotar, false);
  assert.equal(net.hivasok.length, 18);
});

test('a force megkerüli a gyorsítótárat, a cache:false nem olvas és nem ír', async (t) => {
  const gyoker = projekt(t);
  const net = halozat();
  await ellenoriz(gyoker, net);
  assert.equal((await ellenoriz(gyoker, net, { force: true })).gyorsitotar, false);
  const cacheUt = join(gyoker, 'keab/.eszkoz', 'frissites-cache.json');
  const elotte = readFileSync(cacheUt, 'utf8');
  await ellenoriz(gyoker, net, { cache: false, now: () => kezdet + 1 });
  assert.equal(net.hivasok.length, 27);
  assert.equal(readFileSync(cacheUt, 'utf8'), elotte);
});

test('a hibát csak tíz percig gyorsítótárazza, force után újra próbál', async (t) => {
  const gyoker = projekt(t);
  const net = halozat({ hiba: new Error('offline') });
  await ellenoriz(gyoker, net);
  const r = await ellenoriz(gyoker, net, { now: () => kezdet + 10 * 60_000 - 1 });
  assert.equal(r.gyorsitotar, true);
  assert.equal(r.allapot, 'nem-ellenorizheto');
  assert.equal(net.hivasok.length, 1);
  assert.equal((await ellenoriz(gyoker, net, { now: () => kezdet + 10 * 60_000 })).gyorsitotar, false);
  assert.equal(net.hivasok.length, 2);
  assert.equal((await ellenoriz(gyoker, halozat(), { force: true })).allapot, 'egyezik');
});

test('a kiadási eredmény is gyorsítótárba kerül', async (t) => {
  const gyoker = projekt(t);
  const dokumentumok = { ...eredeti, '7.2-hu': modosit('7.2-hu') };
  const net = halozat({ dokumentumok, npm: { versions: { '1.0.0': kiadas('1.0.0', lenyomatok(dokumentumok)) } } });
  const elso = await ellenoriz(gyoker, net);
  assert.deepEqual(await ellenoriz(gyoker, net), { ...elso, gyorsitotar: true });
  assert.equal(net.hivasok.length, 10);
});

test('más csomagverzió és más dokumentumhalmaz érvényteleníti a gyorsítótárat', async (t) => {
  const gyoker = projekt(t);
  const net = halozat();
  await ellenoriz(gyoker, net);
  const uj = structuredClone(jegyzek);
  uj.kutetikaVerzio = '1.0.0';
  writeFileSync(join(gyoker, 'keab/.eszkoz', 'package.json'), JSON.stringify({ name: 'kutetika', version: '1.0.0' }));
  const ut = join(gyoker, 'keab/.eszkoz', 'dokumentumok', 'jegyzek.json');
  writeFileSync(ut, JSON.stringify(uj));
  assert.equal((await ellenoriz(gyoker, net)).gyorsitotar, false);
  uj.dokumentumok[0].ujjlenyomat = `szoveg-sha256:${'0'.repeat(64)}`;
  writeFileSync(ut, JSON.stringify(uj));
  const r = await ellenoriz(gyoker, net);
  assert.equal(r.gyorsitotar, false);
  assert.equal(r.allapot, 'nincs-illo-verzio');
  assert.equal(net.hivasok.length, 28);
});

test('hibás, jövőbeli és ismeretlen állapotú gyorsítótárat nem használ', async (t) => {
  const gyoker = projekt(t);
  const net = halozat();
  await ellenoriz(gyoker, net);
  const cacheUt = join(gyoker, 'keab/.eszkoz', 'frissites-cache.json');
  const cache = JSON.parse(readFileSync(cacheUt, 'utf8'));
  for (const tartalom of ['{hibas', JSON.stringify({ ...cache, eredmeny: { ...cache.eredmeny, elteresek: [null] } }), JSON.stringify({ ...cache, eredmeny: { ...cache.eredmeny, allapot: 'ismeretlen' } })]) {
    writeFileSync(cacheUt, tartalom);
    assert.equal((await ellenoriz(gyoker, net)).gyorsitotar, false);
  }
  assert.equal((await ellenoriz(gyoker, net, { now: () => kezdet - 1 })).gyorsitotar, false);
  assert.equal(net.hivasok.length, 45);
});

test('nem írható gyorsítótár mellett is használható az eredmény', async (t) => {
  const gyoker = projekt(t);
  mkdirSync(join(gyoker, 'keab/.eszkoz', 'frissites-cache.json'));
  const r = await ellenoriz(gyoker, halozat());
  assert.equal(r.allapot, 'egyezik');
  assert.match(r.figyelmeztetesek[0], /gyorsítótárba/);
});

test('hibás helyi jegyzék nem helyettesíthető észrevétlenül a program sajátjával', async (t) => {
  const gyoker = projekt(t);
  writeFileSync(join(gyoker, 'keab/.eszkoz', 'dokumentumok', 'jegyzek.json'), '{}');
  const net = halozat();
  const r = await ellenoriz(gyoker, net);
  assert.equal(r.allapot, 'nem-ellenorizheto');
  assert.equal(r.hiba.szakasz, 'helyi-jegyzek');
  assert.equal(net.hivasok.length, 0);
});

test('hiányos és duplázott helyi jegyzék figyelmeztet', async (t) => {
  const gyoker = projekt(t);
  for (const dokumentumok of [jegyzek.dokumentumok.slice(1), [...jegyzek.dokumentumok, jegyzek.dokumentumok[0]]]) {
    writeFileSync(join(gyoker, 'keab/.eszkoz', 'dokumentumok', 'jegyzek.json'), JSON.stringify({ ...jegyzek, dokumentumok }));
    assert.equal((await ellenoriz(gyoker, halozat())).allapot, 'nem-ellenorizheto');
  }
});

function githubMinta(issues = [], hiba = false) {
  const hivasok = [];
  return {
    hivasok,
    paginate: async (_method, params) => {
      hivasok.push(['lista', params]);
      if (hiba) throw new Error('GitHub nem elérhető');
      return issues;
    },
    rest: { issues: {
      listForRepo: () => {},
      create: async (params) => { hivasok.push(['uj', params]); return { data: { number: 42 } }; },
      update: async (params) => { hivasok.push(['frissit', params]); },
    } },
  };
}

const repo = { owner: 'pelda', repo: 'kutetika' };

test('heti figyelés ugyanazt az ellenőrzést használja, helyi cache nélkül', async (t) => {
  const gyoker = projekt(t);
  const r = await figyeles(gyoker, { ellenoriz: async (root, options) => {
    assert.equal(root, gyoker);
    assert.equal(options.csomagGyoker, gyoker);
    assert.equal(options.force, true);
    assert.equal(options.cache, false);
    return { allapot: 'egyezik', elteresek: [] };
  } });
  const github = githubMinta();
  assert.equal(hibajegyAdatok(r), null);
  assert.equal((await hibajegyBiztosit(github, repo, r)).allapot, 'nem-szukseges');
  assert.equal(github.hivasok.length, 0);
});

for (const allapot of ['frissites-elerheto', 'nincs-illo-verzio', 'nem-ellenorizheto']) {
  test(`heti figyelés hibajegyet hoz létre: ${allapot}`, async () => {
    const github = githubMinta();
    const r = { allapot, elteresek: allapot === 'nem-ellenorizheto' ? [] : [{ azonosito: '7.1-en' }] };
    assert.deepEqual(await hibajegyBiztosit(github, repo, r), { allapot: 'letrehozva', szam: 42 });
    assert.equal(github.hivasok[1][0], 'uj');
    assert.match(github.hivasok[1][1].body, /kutetika:kari-figyeles/);
  });
}

test('a korábbi figyelési hibajegyet frissíti, nem dupláz és nem kommentel', async () => {
  const elozo = hibajegyAdatok({ allapot: 'nem-ellenorizheto' });
  const github = githubMinta([
    { number: 1, body: elozo.body, pull_request: {} },
    { number: 2, body: 'más hibajegy' },
    { number: 3, ...elozo },
  ]);
  const r = { allapot: 'nincs-illo-verzio', elteresek: [{ azonosito: '7.4-hu' }] };
  assert.deepEqual(await hibajegyBiztosit(github, repo, r), { allapot: 'meglevo', szam: 3 });
  assert.equal(github.hivasok[1][0], 'frissit');
  assert.equal(github.hivasok[1][1].issue_number, 3);
  const azonos = githubMinta([{ number: 3, ...hibajegyAdatok(r) }]);
  await hibajegyBiztosit(azonos, repo, r);
  assert.equal(azonos.hivasok.length, 1);
});

test('az ellenőrző feladat hibája is hibajegyet kér, GitHub-hiba figyelmeztet', async () => {
  const r = await figyeles('.', { ellenoriz: async () => { throw new Error('hiba'); } });
  assert.equal(r.allapot, 'nem-ellenorizheto');
  assert.ok(hibajegyAdatok(r));
  assert.ok(hibajegyAdatok(undefined));
  assert.ok(hibajegyAdatok(null));
  const valasz = await hibajegyBiztosit(githubMinta([], true), repo, r);
  assert.equal(valasz.allapot, 'hiba');
  assert.match(valasz.figyelmeztetes, /kézi ellenőrzés/);
});

test('a munkafolyamat heti és kézi, az ellenőrzésnek nincs írásjoga', () => {
  const yaml = readFileSync('.github/workflows/figyeles.yml', 'utf8');
  assert.match(yaml, /schedule:/);
  assert.match(yaml, /workflow_dispatch:/);
  assert.match(yaml, /permissions: \{\}/);
  const [ellenorzes, hibajegy] = yaml.split('  hibajegy:');
  assert.doesNotMatch(ellenorzes, /issues: write/);
  assert.match(hibajegy, /if: always\(\)/);
  assert.match(hibajegy, /issues: write/);
  assert.match(yaml, /cancel-in-progress: false/);
  assert.match(yaml, /npm ci --ignore-scripts/);
  assert.doesNotMatch(yaml, /\$\{\{ needs\.ellenorzes\.outputs\.eredmeny \}\}[^\n]*\n\s*const/);
});
