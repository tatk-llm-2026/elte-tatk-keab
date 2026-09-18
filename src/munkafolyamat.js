import { appendFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { CSOMAG_GYOKER } from './csomag.js';
import { beolvas, vazKeszit } from './kerelem.js';
import { mezoterkepBetolt } from './mezoterkep.js';

export const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const objektum = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
export const szoveg = (v) => typeof v === 'string' && v.trim().length > 0;
export const kivonat = (v) => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);

export function helyiUt(root, fajl) {
  if (!szoveg(fajl) || fajl.includes('\\') || fajl.includes('\0') || fajl.split('/').some((p) => !p || p === '.' || p === '..') || fajl.startsWith('/')) throw new Error('Érvénytelen helyi fájlnév.');
  let ut = resolve(root);
  if (lstatSync(ut).isSymbolicLink()) throw new Error('Hivatkozott mappa nem használható.');
  for (const resz of fajl.split('/')) {
    ut = join(ut, resz);
    try { if (lstatSync(ut).isSymbolicLink()) throw new Error('Szimbolikus hivatkozás nem használható.'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  return ut;
}

export function olvas(root, fajl) {
  const ut = helyiUt(root, fajl);
  if (!lstatSync(ut).isFile()) throw new Error('Nem szabályos fájl.');
  return readFileSync(ut);
}

export function ir(root, fajl, tartalom) {
  const ut = helyiUt(root, fajl);
  mkdirSync(dirname(ut), { recursive: true });
  const atmeneti = `${ut}.${randomUUID()}.tmp`;
  writeFileSync(atmeneti, tartalom, { flag: 'wx', mode: 0o600 });
  // Windowson a Wordben nyitva lévő fájl nem cserélhető; ilyenkor ne maradjon szemét.
  try { renameSync(atmeneti, ut); } catch (e) { try { unlinkSync(atmeneti); } catch {} throw e; }
}

export function naplo(root, adat) {
  const ut = helyiUt(root, 'keab/dontesek.md');
  mkdirSync(dirname(ut), { recursive: true });
  appendFileSync(ut, `\n## ${new Date().toISOString()}\n\n${JSON.stringify(adat)}\n`, { mode: 0o600 });
}

function fut(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

export async function zarol(root, munka) {
  const ut = helyiUt(root, 'keab/.folyamat-zar');
  mkdirSync(dirname(ut), { recursive: true });
  const lefoglal = () => writeFileSync(ut, String(process.pid), { flag: 'wx', mode: 0o600 });
  try { lefoglal(); } catch {
    // A megszakadt (már nem futó) művelet zárolását eltávolítjuk.
    let pid;
    try { pid = Number(readFileSync(ut, 'utf8').trim()); } catch {}
    if (fut(pid)) throw new Error('Egy másik kutetika-művelet még fut. Várja meg, amíg befejeződik, és próbálja újra.');
    try { unlinkSync(ut); lefoglal(); } catch { throw new Error('Egy másik kutetika-művelet most indult el. Próbálja újra kicsit később.'); }
  }
  try { return await munka(); } finally { unlinkSync(ut); }
}

export function allapotOlvas(root) {
  try {
    const s = JSON.parse(olvas(root, 'keab/.ellenorzes.json'));
    if (s.sema !== 1 || !objektum(s.engedelyek) || !objektum(s.generalt) || Object.values(s.generalt).some((v) => !kivonat(v))
      || Object.entries(s.engedelyek).some(([k, v]) => !['claude', 'codex'].includes(k) || typeof v !== 'boolean')
      || (s.futas != null && !futasErvenyes(s.futas))) throw new Error('Sérült állapot.');
    return s;
  } catch (e) {
    return { sema: 1, engedelyek: {}, generalt: {}, serult: e.code !== 'ENOENT', futas: null };
  }
}

export function allapotIr(root, s) {
  ir(root, 'keab/.ellenorzes.json', `${JSON.stringify(s, null, 2)}\n`);
}

export function anyagBetolt(root) {
  const gyoker = existsSync(join(root, '.kutetika', 'dokumentumok')) ? join(root, '.kutetika') : CSOMAG_GYOKER;
  const terkepBetolto = (u, n) => mezoterkepBetolt(u, n, gyoker);
  const bytes = olvas(root, 'keab/kerelem.md');
  const draft = beolvas(bytes.toString('utf8'), terkepBetolto);
  if (!draft.nyelv) throw new Error(draft.hibak.join(' '));
  const jegyzek = JSON.parse(olvas(gyoker, 'dokumentumok/jegyzek.json'));
  return { gyoker, terkepBetolto, bytes, draft, jegyzek };
}

export function wordLista(root) {
  const ut = helyiUt(root, 'keab');
  const lista = [];
  const bejar = (rel) => {
    for (const e of readdirSync(join(ut, rel), { withFileTypes: true })) {
      // Rejtett fájlok és a Word ideiglenes „~$” fájljai (amíg egy dokumentum nyitva van).
      if (e.name.startsWith('.') || e.name.startsWith('~$')) continue;
      const fajl = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) bejar(fajl);
      else if (/\.docx$/i.test(e.name)) lista.push(`keab/${fajl}`);
    }
  };
  bejar('');
  return lista.sort();
}

export function pillanatkep(root, fajlok) {
  return Object.fromEntries([...new Set(['keab/kerelem.md', ...fajlok])].sort().map((f) => {
    try { return [f, hash(olvas(root, f))]; } catch { return [f, null]; }
  }));
}

export function pillanatEgyezik(root, futas) {
  if (!objektum(futas?.pillanatkep) || !Array.isArray(futas.wordok) || !Array.isArray(futas.fajlok)
    || !kivonat(futas.token) || futas.token !== hash(JSON.stringify(futas.pillanatkep))
    || !kivonat(futas.pillanatkep['keab/kerelem.md'])) return false;
  try {
    if (JSON.stringify(wordLista(root)) !== JSON.stringify(futas.wordok)) return false;
    return JSON.stringify(pillanatkep(root, futas.fajlok)) === JSON.stringify(futas.pillanatkep);
  } catch { return false; }
}

export function kifogasokRendez(lista) {
  const rang = { sulyos: 0, javitando: 1, figyelmeztetes: 2 };
  return [...lista].sort((a, b) => rang[a.sulyossag] - rang[b.sulyossag] || a.azonosito.localeCompare(b.azonosito));
}

function futasErvenyes(f) {
  const utak = (v) => Array.isArray(v) && v.every((p) => szoveg(p) && p.startsWith('keab/') && !p.split('/').some((s) => s === '..' || s === '.')) && new Set(v).size === v.length;
  return objektum(f) && ['vegleges', 'munkaanyag'].includes(f.tipus) && ['hu', 'en'].includes(f.nyelv)
    && objektum(f.pillanatkep) && Object.values(f.pillanatkep).every((v) => v === null || kivonat(v))
    && kivonat(f.token) && ['generalt', 'csatolando', 'fajlok', 'wordok'].every((p) => utak(f[p]))
    && f.generalt.every((p) => f.csatolando.includes(p) && f.fajlok.includes(p))
    && f.csatolando.every((p) => f.fajlok.includes(p)) && f.wordok.every((p) => f.fajlok.includes(p))
    && (f.tipus !== 'vegleges' || f.generalt.length === 4)
    && Array.isArray(f.dokumentumok) && f.dokumentumok.every((d) => objektum(d) && szoveg(d.azonosito) && szoveg(d.ujjlenyomat))
    && objektum(f.biralat) && typeof f.biralat.allapot === 'string'
    && (f.biralat.allapot !== 'kesz' || (szoveg(f.biralat.keres) && kivonat(f.biralat.token)
      && ['kulso', 'subagent', 'uj-beszelgetes'].includes(f.biralat.mod) && szoveg(f.biralat.asszisztens)
      && Array.isArray(f.biralat.kifogasok) && f.biralat.kifogasok.every(kifogasErvenyes)))
    && (f.keres == null || (objektum(f.keres) && szoveg(f.keres.azonosito)))
    && Array.isArray(f.formai) && f.formai.every(kifogasErvenyes)
    && Array.isArray(f.felulbiralasok) && f.felulbiralasok.every((v) => objektum(v) && szoveg(v.azonosito) && szoveg(v.indok) && kivonat(v.token))
    && objektum(f.frissites) && typeof f.frissites.allapot === 'string'
    && Array.isArray(f.frissites.figyelmeztetesek) && f.frissites.figyelmeztetesek.every((v) => typeof v === 'string');
}

export function kifogasErvenyes(k) {
  return objektum(k) && ['sulyos', 'javitando', 'figyelmeztetes'].includes(k.sulyossag)
    && ['azonosito', 'hely', 'problema'].every((v) => szoveg(k[v])) && (k.szabalyzat == null || typeof k.szabalyzat === 'string');
}

// Az üres munkaanyag létrehozása a beadvány nyelvén. Meglévő munkaanyagot nem ír felül.
export async function vazIr(root, { nyelv } = {}) {
  return zarol(root, () => {
    if (!['hu', 'en'].includes(nyelv)) throw new Error('A beadvány nyelve szükséges: hu vagy en.');
    try {
      olvas(root, 'keab/kerelem.md');
      return { allapot: 'mar-letezik', fajl: 'keab/kerelem.md' };
    } catch (e) { if (e.code !== 'ENOENT') throw e; }
    const gyoker = existsSync(join(root, '.kutetika', 'dokumentumok')) ? join(root, '.kutetika') : CSOMAG_GYOKER;
    ir(root, 'keab/kerelem.md', vazKeszit(nyelv, (u, n) => mezoterkepBetolt(u, n, gyoker)));
    return { allapot: 'letrehozva', fajl: 'keab/kerelem.md', nyelv };
  });
}
