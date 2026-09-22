// Átdolgozás a bizottság értékelőlapja alapján: az előző beadás megőrzése, a korábbi
// Word-beadás beolvasása, a bizottsági pontok (keab/atdolgozas.md) és a válaszlevél.
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { CSOMAG_GYOKER, PROGRAM_MAPPA } from './csomag.js';
import { mezoterkepBetolt, URLAPOK } from './mezoterkep.js';
import { urlapBeolvas } from './beolvasas.js';
import { vazKeszit } from './kerelem.js';
import { ELOZMENY, allapotIr, allapotOlvas, hash, ir, naplo, objektum, olvas, pillanatEgyezik, szoveg, zarol } from './munkafolyamat.js';

export const ATDOLGOZAS = 'keab/atdolgozas.md';
export const VALASZLEVEL = 'keab/valaszlevel.md';

const FEJLEC = { azonosito: 'Előző eljárás', dontes: 'Bizottsági döntés', ertekelolap: 'Értékelőlap', visszakuldes: 'Visszaküldés' };
const ALLAPOTOK = { nyitott: 'nyitott', javitva: 'javitva', 'javítva': 'javitva', 'nem-teljesitheto': 'nem-teljesitheto', 'nem teljesíthető': 'nem-teljesitheto', 'nem-teljesíthető': 'nem-teljesitheto', 'nem teljesitheto': 'nem-teljesitheto' };
const ALFEJEZETEK = { 'A bizottság szövege': 'bizottsag', 'Mi változott': 'valtozas', 'Indoklás': 'indoklas' };

function gyoker(root) {
  return existsSync(join(root, PROGRAM_MAPPA, 'dokumentumok')) ? join(root, PROGRAM_MAPPA) : CSOMAG_GYOKER;
}

export function atdolgozasVaz({ azonosito = '', dontes = '', ertekelolap = '', visszakuldes = '' } = {}) {
  return `<!-- kutetika-atdolgozas -->
# Átdolgozás

${FEJLEC.azonosito}: ${azonosito}
${FEJLEC.dontes}: ${dontes}
${FEJLEC.ertekelolap}: ${ertekelolap}
${FEJLEC.visszakuldes}: ${visszakuldes}

<!--
A bizottság értékelőlapjának pontjai. Minden kérés külön pont: „## [sorszám] rövid cím”.
Állapot: nyitott, javítva vagy nem teljesíthető.
Érintett: a munkaanyag mezői (pl. 7.2/[5]) és a mellékletek.
„A bizottság szövege”: szó szerint az értékelőlapról.
„Mi változott” és „Indoklás”: a beadvány nyelvén, mert ebből készül a válaszlevél.
A „Visszaküldés” sor akkor kell, ha az értékelőlap megmondja, kinek és hová kell visszaküldeni.
-->

# Kísérőszöveg
<!-- A válaszlevél bevezetője a beadvány nyelvén. Üresen is maradhat. -->

# Pontok
`;
}

// A keab/atdolgozas.md beolvasása: { fejlec, kisero, pontok: [...], hibak: [...] }.
export function atdolgozasOlvas(szoveg) {
  szoveg = szoveg.replace(/^﻿/, '').replace(/\r\n?/g, '\n').normalize('NFC').replace(/<!--[\s\S]*?-->/g, '');
  const fejlec = {};
  const pontok = [];
  const hibak = [];
  let resz = 'fejlec';
  let kisero = [];
  let pont = null;
  let al = null;
  for (const sor of szoveg.split('\n')) {
    const fo = /^# (.+)$/.exec(sor);
    if (fo) {
      const cim = fo[1].trim();
      resz = cim === 'Átdolgozás' ? 'fejlec' : cim === 'Kísérőszöveg' ? 'kisero' : cim === 'Pontok' ? 'pontok' : null;
      if (!resz) hibak.push(`Felismerhetetlen fejezetcím az atdolgozas.md-ben: „# ${cim}”.`);
      pont = null;
      continue;
    }
    if (resz === 'fejlec') {
      const t = /^([^:]+):\s*(.*)$/.exec(sor);
      const kulcs = t && Object.entries(FEJLEC).find(([, v]) => v === t[1].trim())?.[0];
      if (kulcs) fejlec[kulcs] = t[2].trim();
      continue;
    }
    if (resz === 'kisero') { kisero.push(sor); continue; }
    if (resz !== 'pontok') continue;
    const pc = /^## (.*)$/.exec(sor);
    if (pc) {
      const t = /^\[(\d+)\]\s*(.*)$/.exec(pc[1].trim());
      if (!t) { hibak.push(`Felismerhetetlen pontcím: „## ${pc[1]}”; a formája „## [sorszám] cím”.`); pont = null; continue; }
      pont = { szam: t[1], cim: t[2].trim(), allapot: null, erintett: '', bizottsag: [], valtozas: [], indoklas: [] };
      pontok.push(pont);
      al = null;
      continue;
    }
    if (!pont) { if (sor.trim()) hibak.push(`A pontok előtt értelmezhetetlen sor: „${sor.trim()}”.`); continue; }
    const ac = /^### (.*)$/.exec(sor);
    if (ac) {
      al = ALFEJEZETEK[ac[1].trim()] ?? null;
      if (!al) hibak.push(`A(z) [${pont.szam}] pontban felismerhetetlen alcím: „### ${ac[1]}”.`);
      continue;
    }
    const all = /^Állapot:\s*(.*)$/.exec(sor);
    if (all && !al) {
      pont.allapot = ALLAPOTOK[all[1].trim().toLowerCase()] ?? null;
      if (!pont.allapot) hibak.push(`A(z) [${pont.szam}] pont állapota ismeretlen: „${all[1].trim()}”; lehet: nyitott, javítva, nem teljesíthető.`);
      continue;
    }
    const er = /^Érintett:\s*(.*)$/.exec(sor);
    if (er && !al) { pont.erintett = er[1].trim(); continue; }
    if (al) pont[al].push(sor);
  }
  for (const p of pontok) for (const k of Object.values(ALFEJEZETEK)) p[k] = p[k].join('\n').trim();
  const szamok = pontok.map((p) => p.szam);
  for (const sz of new Set(szamok.filter((v, i) => szamok.indexOf(v) !== i))) hibak.push(`A(z) [${sz}] pont kétszer szerepel.`);
  return { fejlec, kisero: kisero.join('\n').trim(), pontok, hibak };
}

// Csak átdolgozáskor van ilyen fájl; különben null.
export function atdolgozasBetolt(root) {
  try { return atdolgozasOlvas(olvas(root, ATDOLGOZAS).toString('utf8')); } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

export function atdolgozasFormai(atd) {
  const lista = [];
  const hozzaad = (azonosito, problema) => lista.push({ azonosito: `formai:atdolgozas:${azonosito}`, hely: ATDOLGOZAS, problema, sulyossag: 'javitando', szabalyzat: null });
  atd.hibak.forEach((h, i) => hozzaad(`hiba:${i}`, h));
  if (!atd.pontok.length) hozzaad('nincs-pont', 'Az atdolgozas.md-ben nincs egyetlen bizottsági pont sem.');
  for (const p of atd.pontok) {
    const hely = `[${p.szam}] ${p.cim}`;
    if (!p.bizottsag) hozzaad(`${p.szam}:szoveg`, `${hely}: hiányzik a bizottság szövege.`);
    if (!p.allapot || p.allapot === 'nyitott') hozzaad(`${p.szam}:nyitott`, `${hely}: a bizottsági pont még nyitott.`);
    if (p.allapot === 'javitva' && !p.valtozas) hozzaad(`${p.szam}:valtozas`, `${hely}: javítottnak jelölt, de nincs leírva, mi változott és hol.`);
    if (p.allapot === 'nem-teljesitheto' && !p.indoklas) hozzaad(`${p.szam}:indoklas`, `${hely}: nem teljesíthetőnek jelölt, de hiányzik a kutató indoklása.`);
  }
  return lista;
}

const LEVEL = {
  hu: { cim: 'Válasz a Kutatásintegritási, Etikai és Adatkezelési Bizottság értékelésére', eljaras: 'Előző eljárás', keres: 'A Bizottság kérése', allapot: 'Állapot', valtozas: 'Változás', indoklas: 'Indoklás',
    allapotok: { javitva: 'javítva', 'nem-teljesitheto': 'nem teljesítettük', nyitott: 'nyitott' } },
  en: { cim: 'Response to the evaluation of the Research Integrity, Ethics and Data Management Committee', eljaras: 'Previous procedure', keres: 'The Committee’s request', allapot: 'Status', valtozas: 'Change', indoklas: 'Reason',
    allapotok: { javitva: 'addressed', 'nem-teljesitheto': 'not addressed', nyitott: 'open' } },
};

export function valaszlevelSzoveg(atd, nyelv) {
  const l = LEVEL[nyelv];
  const reszek = [l.cim];
  if (atd.fejlec.azonosito) reszek.push(`${l.eljaras}: ${atd.fejlec.azonosito}`);
  if (atd.kisero) reszek.push(atd.kisero);
  for (const p of atd.pontok) {
    const sorok = [`${p.szam}. ${p.cim}`, `${l.keres}: ${p.bizottsag}`, `${l.allapot}: ${l.allapotok[p.allapot ?? 'nyitott']}`];
    if (p.valtozas) sorok.push(`${l.valtozas}: ${p.valtozas}`);
    if (p.indoklas) sorok.push(`${l.indoklas}: ${p.indoklas}`);
    reszek.push(sorok.join('\n'));
  }
  return `${reszek.join('\n\n')}\n`;
}

const DATUM = /^\d{4}-\d{2}-\d{2}$/;

// Az átdolgozás megkezdése: az értékelőlap és a beadott fájlok a keab/elozmeny/<dátum>/ alá,
// ujjlenyomattal; az atdolgozas.md váza. Létező előzményt nem ír felül.
export async function atdolgozasKezd(root, { ertekelolap, datum, beadott, azonosito = '', dontes = '', visszakuldes = '' } = {}) {
  return zarol(root, () => {
    if (!szoveg(ertekelolap)) throw new Error('Az értékelőlap fájlja szükséges (a projekt mappáján belül).');
    if (!szoveg(datum) || !DATUM.test(datum) || !Number.isFinite(new Date(datum).getTime())) throw new Error('A beadás dátuma szükséges ÉÉÉÉ-HH-NN alakban.');
    if (beadott !== undefined && (!Array.isArray(beadott) || !beadott.every(szoveg))) throw new Error('A beadott fájlok listája fájlnevek tömbje legyen.');
    for (const v of [azonosito, dontes, visszakuldes]) if (typeof v !== 'string' || v.includes('\n')) throw new Error('Az azonosító, a döntés és a visszaküldés egysoros szöveg legyen.');
    const mappa = `${ELOZMENY}${datum}`;
    if (existsSync(join(root, mappa))) return { allapot: 'mar-letezik', mappa, figyelmeztetesek: ['Ez az előzmény már megvan; nem írtam felül.'] };
    const s = allapotOlvas(root);
    const figyelmeztetesek = [];
    let fajlok = beadott;
    if (fajlok === undefined) {
      const f = s.futas;
      if (s.serult || f?.tipus !== 'vegleges') throw new Error('Nincs korábbi előállítás; add meg a beadott fájlokat (beadott).');
      if (!pillanatEgyezik(root, f)) figyelmeztetesek.push('A fájlok az utolsó előállítás óta módosultak; a mostani állapotukat mentettem el előzményként.');
      fajlok = [...f.csatolando, 'keab/kerelem.md', 'keab/bead.md'].filter((p) => existsSync(join(root, p)));
    }
    const masolando = [ertekelolap, ...fajlok.filter((p) => p !== ertekelolap)];
    const nevek = masolando.map((p) => basename(p));
    if (new Set(nevek).size !== nevek.length) throw new Error('Két fájlnak azonos a neve; nevezd át az egyiket.');
    if (masolando.some((p) => p.startsWith(ELOZMENY))) throw new Error('Az előzmény mappából nem lehet újra előzményt menteni.');
    const bajtok = masolando.map((p) => olvas(root, p));
    const ujjlenyomatok = {};
    masolando.forEach((p, i) => {
      const cel = `${mappa}/${nevek[i]}`;
      ir(root, cel, bajtok[i], { elozmeny: true });
      ujjlenyomatok[cel] = hash(bajtok[i]);
    });
    const ertekelolapUt = `${mappa}/${nevek[0]}`;
    s.atdolgozas = { mappa, ertekelolap: ertekelolapUt, ujjlenyomatok, kezdve: new Date().toISOString() };
    allapotIr(root, s);
    let atdolgozasFajl = 'mar-letezik';
    if (!existsSync(join(root, ATDOLGOZAS))) {
      ir(root, ATDOLGOZAS, atdolgozasVaz({ azonosito, dontes, ertekelolap: ertekelolapUt, visszakuldes }));
      atdolgozasFajl = 'letrehozva';
    }
    naplo(root, { tipus: 'atdolgozas-kezdete', elozmeny: mappa, fajlok: Object.keys(ujjlenyomatok), azonosito, dontes });
    return { allapot: 'letrehozva', mappa, ertekelolap: ertekelolapUt, fajlok: Object.keys(ujjlenyomatok), atdolgozas: ATDOLGOZAS, atdolgozasFajl, figyelmeztetesek };
  });
}

// Korábbi, nem az eszközzel készült beadás beolvasása a munkaanyagba. Meglévő munkaanyagot nem ír felül.
export async function wordBeolvas(root, { nyelv, fajlok } = {}) {
  return zarol(root, () => {
    if (!['hu', 'en'].includes(nyelv)) throw new Error('A beadvány nyelve szükséges: hu vagy en.');
    if (!objektum(fajlok) || !Object.keys(fajlok).length || Object.entries(fajlok).some(([u, p]) => !URLAPOK.includes(u) || !szoveg(p))) throw new Error('A beadott űrlapok szükségesek, pl. {"7.2":"keab/elozmeny/…/7.2 ….docx"}.');
    if (existsSync(join(root, 'keab/kerelem.md'))) return { allapot: 'mar-letezik', fajl: 'keab/kerelem.md' };
    const gy = gyoker(root);
    const terkepBetolto = (u, n) => mezoterkepBetolt(u, n, gy);
    const valaszok = {};
    const ellenorizendo = {};
    const lista = [];
    const eltolt = {};
    for (const u of URLAPOK) {
      if (!fajlok[u]) continue;
      const terkep = terkepBetolto(u, nyelv);
      let e;
      try { e = urlapBeolvas(olvas(gy, `dokumentumok/${u}-${nyelv}.docx`), olvas(root, fajlok[u]), terkep); } catch (hiba) {
        if (hiba.code === 'ENOENT') throw new Error(`Nem található: ${fajlok[u]}`);
        throw new Error(`A(z) ${fajlok[u]} nem olvasható Word-fájlként (${hiba.message}).`);
      }
      valaszok[u] = e.valaszok;
      ellenorizendo[u] = e.ellenorizendo;
      if (e.eltolt.length) eltolt[u] = e.eltolt;
      for (const [azon, ok] of Object.entries(e.ellenorizendo)) lista.push({ urlap: u, mezo: azon, kerdes: terkep.mezok.find((m) => m.azonosito === azon)?.kerdes, ok });
    }
    ir(root, 'keab/kerelem.md', vazKeszit(nyelv, terkepBetolto, { valaszok, ellenorizendo }));
    naplo(root, { tipus: 'beolvasas', fajlok, ellenorizendo: lista,
      ...(Object.keys(eltolt).length ? { regebbiUrlap: eltolt, gepiJavaslat: 'A beadott űrlap szerkezete eltér a mostani karitól; a válaszokat a kérdés szövege alapján a mostani űrlap mezőibe töltöttem.' } : {}) });
    return { allapot: 'beolvasva', fajl: 'keab/kerelem.md', nyelv, ellenorizendo: lista, regebbiUrlap: eltolt, hianyzo: URLAPOK.filter((u) => !fajlok[u]) };
  });
}
