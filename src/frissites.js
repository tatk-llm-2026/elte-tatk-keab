import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CSOMAG_GYOKER, csomagJson } from './csomag.js';
import { KAR_OLDAL, KARI_DOKUMENTUMOK, linkekKeresese } from './kar.js';
import { csomagUjjlenyomatok } from './jegyzek.js';
import { sha256, ujjlenyomat } from './ujjlenyomat.js';

const EGY_NAP = 86_400_000;
// A sikertelen ellenőrzést (pl. rövid internetkimaradás) csak rövid ideig jegyezzük meg.
const HIBA_ERVENYES = 10 * 60_000;
const NPM_CIM = 'https://registry.npmjs.org/';
const AZONOSITOK = KARI_DOKUMENTUMOK.map((d) => d.azonosito);
const STABIL_VERZIO = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

function teljesUjjlenyomatok(ujjlenyomatok) {
  return ujjlenyomatok && typeof ujjlenyomatok === 'object'
    && Object.keys(ujjlenyomatok).length === AZONOSITOK.length
    && KARI_DOKUMENTUMOK.every((d) => new RegExp(`^${d.tipus === 'pdf' ? 'fajl' : 'szoveg'}-sha256:[0-9a-f]{64}$`).test(ujjlenyomatok[d.azonosito]));
}

function verzioHasonlit(a, b) {
  const aa = STABIL_VERZIO.exec(a).slice(1, 4).map(BigInt);
  const bb = STABIL_VERZIO.exec(b).slice(1, 4).map(BigInt);
  for (let i = 0; i < 3; i++) {
    if (aa[i] !== bb[i]) return aa[i] > bb[i] ? 1 : -1;
  }
  return a.localeCompare(b);
}

function illoVerzio(adatok, kari, aktualis) {
  if (!adatok?.versions || typeof adatok.versions !== 'object' || Array.isArray(adatok.versions)) {
    throw new Error('Az npm verziólistája nem értelmezhető.');
  }
  return Object.entries(adatok.versions)
    .filter(([verzio, pkg]) => STABIL_VERZIO.test(verzio) && pkg?.version === verzio
      && !pkg.deprecated && teljesUjjlenyomatok(pkg.kutetika?.dokumentumok)
      && AZONOSITOK.every((id) => pkg.kutetika.dokumentumok[id] === kari[id])
      && (!STABIL_VERZIO.test(aktualis) || verzioHasonlit(verzio, aktualis) > 0))
    .map(([verzio]) => verzio)
    .sort(verzioHasonlit).at(-1) ?? null;
}

function uzenetek(eredmeny) {
  const modositott = eredmeny.elteresek.map((d) => d.azonosito).join(', ');
  if (eredmeny.allapot === 'egyezik') return [];
  if (eredmeny.allapot === 'frissites-elerheto') {
    return [`A kar módosította ezeket: ${modositott}. Frissítsen a kutetika ${eredmeny.ujVerzio} verziójára. A munka folytatható.`];
  }
  if (eredmeny.allapot === 'nincs-illo-verzio') {
    return [`A kar módosította ezeket: ${modositott}, de még nincs hozzájuk illő kutetika-verzió. A munka folytatható.`];
  }
  return [`Nem sikerült ellenőrizni a kari dokumentumokat vagy a hozzájuk illő kiadást (${eredmeny.hiba?.szakasz ?? 'ellenőrzés'}).${modositott ? ` A kar módosította ezeket: ${modositott}.` : ''} A munka folytatható.`];
}

function ervenyesGyorsitotar(adat, kulcs, most) {
  const r = adat?.eredmeny;
  const kor = most - Date.parse(r?.ellenorizve);
  if (adat?.schema !== 1 || adat.kulcs !== kulcs || !Number.isFinite(kor) || kor < 0 || kor >= EGY_NAP
    || !r || !Array.isArray(r.elteresek) || r.folytathato !== true
    || r.elteresek.some((d) => !d || !AZONOSITOK.includes(d.azonosito)
      || typeof d.helyi !== 'string' || typeof d.kari !== 'string')) return false;
  if (r.allapot === 'nem-ellenorizheto') return kor < HIBA_ERVENYES && typeof r.hiba?.szakasz === 'string';
  if (!teljesUjjlenyomatok(r.kariUjjlenyomatok) || r.hiba !== null) return false;
  if (r.allapot === 'egyezik') return r.elteresek.length === 0 && r.ujVerzio === null;
  if (r.allapot === 'nincs-illo-verzio') return r.elteresek.length > 0 && r.ujVerzio === null;
  return r.allapot === 'frissites-elerheto' && r.elteresek.length > 0 && STABIL_VERZIO.test(r.ujVerzio);
}

export async function frissitesEllenoriz(projectRoot, options = {}) {
  let szakasz = 'helyi-jegyzek';
  let cacheUt;
  let kulcs;
  let eredmeny = {
    allapot: 'nem-ellenorizheto',
    verzio: null,
    ujVerzio: null,
    elteresek: [],
    kariUjjlenyomatok: {},
    ellenorizve: null,
    gyorsitotar: false,
    folytathato: true,
    hiba: null,
    figyelmeztetesek: [],
  };
  try {
    const most = new Date((options.now ?? Date.now)()).getTime();
    eredmeny.ellenorizve = new Date(most).toISOString();
    const helyi = join(projectRoot, '.kutetika');
    const gyoker = options.csomagGyoker ?? (existsSync(join(helyi, 'package.json'))
      || existsSync(join(helyi, 'dokumentumok')) ? helyi : CSOMAG_GYOKER);
    const pkg = gyoker === CSOMAG_GYOKER ? csomagJson() : JSON.parse(await readFile(join(gyoker, 'package.json'), 'utf8'));
    const jegyzek = JSON.parse(await readFile(join(gyoker, 'dokumentumok', 'jegyzek.json'), 'utf8'));
    const helyiUjjlenyomatok = csomagUjjlenyomatok(jegyzek);
    if (jegyzek.dokumentumok.length !== AZONOSITOK.length || !teljesUjjlenyomatok(helyiUjjlenyomatok)
      || typeof pkg.version !== 'string' || typeof pkg.name !== 'string'
      || jegyzek.kutetikaVerzio !== pkg.version) throw new Error('Hiányos vagy eltérő verziójú helyi dokumentumjegyzék.');
    eredmeny.verzio = pkg.version;
    kulcs = sha256(JSON.stringify([pkg.name, pkg.version, AZONOSITOK.map((id) => helyiUjjlenyomatok[id])]));
    cacheUt = join(helyi, 'frissites-cache.json');
    if (!options.force && options.cache !== false) {
      try {
        const adat = JSON.parse(await readFile(cacheUt, 'utf8'));
        if (ervenyesGyorsitotar(adat, kulcs, most)) {
          eredmeny = { ...adat.eredmeny, gyorsitotar: true };
          return { ...eredmeny, figyelmeztetesek: uzenetek(eredmeny) };
        }
      } catch {}
    }
    const fetchFn = options.fetch ?? globalThis.fetch;
    const signal = AbortSignal.timeout(options.timeoutMs ?? 30_000);
    async function leker(cim) {
      const valasz = await fetchFn(cim, { signal, headers: { Accept: '*/*' } });
      if (!valasz.ok) throw new Error(`HTTP ${valasz.status}`);
      return valasz;
    }
    szakasz = 'kari-oldal';
    const html = await (await leker(KAR_OLDAL)).text();
    szakasz = 'kari-linkek';
    const linkek = linkekKeresese(html);
    const hianyzok = AZONOSITOK.filter((id) => !linkek[id]);
    if (hianyzok.length) throw new Error(`Nem található link: ${hianyzok.join(', ')}`);
    for (const cim of Object.values(linkek)) {
      const url = new URL(cim);
      if (url.protocol !== 'https:' || url.origin !== new URL(KAR_OLDAL).origin) {
        throw new Error('A dokumentum linkje nem a kar biztonságos oldalára mutat.');
      }
    }
    szakasz = 'kari-dokumentumok';
    const letoltesek = await Promise.allSettled(KARI_DOKUMENTUMOK.map(async (dok) => {
      const valasz = await leker(linkek[dok.azonosito]);
      const buffer = Buffer.from(await valasz.arrayBuffer());
      if (dok.tipus === 'pdf' && !buffer.subarray(0, 1024).includes(Buffer.from('%PDF-'))) {
        throw new Error(`Nem PDF-dokumentum: ${dok.azonosito}`);
      }
      return [dok.azonosito, ujjlenyomat(buffer, dok.tipus)];
    }));
    eredmeny.kariUjjlenyomatok = Object.fromEntries(letoltesek.filter((r) => r.status === 'fulfilled').map((r) => r.value));
    eredmeny.elteresek = AZONOSITOK.filter((id) => eredmeny.kariUjjlenyomatok[id]
      && helyiUjjlenyomatok[id] !== eredmeny.kariUjjlenyomatok[id])
      .map((id) => ({ azonosito: id, helyi: helyiUjjlenyomatok[id], kari: eredmeny.kariUjjlenyomatok[id] }));
    const hiba = letoltesek.find((r) => r.status === 'rejected');
    if (hiba) throw hiba.reason;
    if (eredmeny.elteresek.length === 0) {
      eredmeny.allapot = 'egyezik';
    } else {
      szakasz = 'npm';
      const valasz = await fetchFn(`${NPM_CIM}${encodeURIComponent(pkg.name)}`, {
        signal, headers: { Accept: 'application/json' },
      });
      if (valasz.status === 404) {
        eredmeny.ujVerzio = null;
      } else {
        if (!valasz.ok) throw new Error(`HTTP ${valasz.status}`);
        eredmeny.ujVerzio = illoVerzio(await valasz.json(), eredmeny.kariUjjlenyomatok, pkg.version);
      }
      eredmeny.allapot = eredmeny.ujVerzio ? 'frissites-elerheto' : 'nincs-illo-verzio';
    }
  } catch (hiba) {
    eredmeny.allapot = 'nem-ellenorizheto';
    eredmeny.hiba = { szakasz, uzenet: hiba instanceof Error ? hiba.message : 'Ismeretlen ellenőrzési hiba.' };
  }
  eredmeny.figyelmeztetesek = uzenetek(eredmeny);
  if (cacheUt && kulcs && options.cache !== false) {
    try {
      await mkdir(join(projectRoot, '.kutetika'), { recursive: true });
      await writeFile(cacheUt, `${JSON.stringify({ schema: 1, kulcs, eredmeny }, null, 2)}\n`);
    } catch {
      eredmeny.figyelmeztetesek.push('Az ellenőrzés eredményét nem sikerült gyorsítótárba menteni. A munka folytatható.');
    }
  }
  return eredmeny;
}
