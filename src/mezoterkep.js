// Mezőtérképek: melyik űrlapmező hol van a kari Word-űrlapban, és milyen szabályok vonatkoznak rá.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CSOMAG_GYOKER } from './csomag.js';
import { bekezdesSzoveg, cellaSzoveg, gyerekek, W } from './docx.js';
import { normalizal } from './ujjlenyomat.js';

export const URLAPOK = ['7.2', '7.4', '7.1'];

export function mezoterkepBetolt(urlap, nyelv, gyoker = CSOMAG_GYOKER) {
  return JSON.parse(readFileSync(join(gyoker, 'mezoterkepek', `${urlap}-${nyelv}.json`), 'utf8'));
}

export function tablazatok(dom) {
  return [...dom.getElementsByTagNameNS(W, 'tbl')].filter((t) => {
    for (let s = t.parentNode; s; s = s.parentNode) if (s.localName === 'tbl') return false;
    return true;
  });
}

export function cella(dom, { tablazat, sor, cella: oszlop }) {
  const tbl = tablazatok(dom)[tablazat];
  const tr = tbl && gyerekek(tbl, 'tr')[sor];
  return tr ? gyerekek(tr, 'tc')[oszlop] ?? null : null;
}

export function bekezdesek(dom) {
  return [...dom.getElementsByTagNameNS(W, 'p')];
}

// Szószámkorlát kiolvasása a kérdés szövegéből: "(min. 100, max. 200 szó)", "(max. 200 words)".
export function szoszamKorlat(kerdes) {
  const t = /\((?:min\.\s*(\d+),\s*)?max\.\s*(\d+)\s*(?:szó|words?)\)/i.exec(kerdes);
  return t ? { min: t[1] ? Number(t[1]) : null, max: Number(t[2]) } : null;
}

// Ellenőrzi, hogy a Word-űrlap szerkezete megfelel-e a mezőtérképnek.
// Hibalistát ad vissza; üres lista esetén a térkép használható.
export function szerkezetEllenorzes(dom, terkep) {
  const hibak = [];
  const bekSzovegek = bekezdesek(dom).map(bekezdesSzoveg);
  for (const mezo of terkep.mezok) {
    if (mezo.kerdesHely) {
      const tc = cella(dom, mezo.kerdesHely);
      if (!tc) hibak.push(`${mezo.azonosito}: nincs meg a kérdés cellája`);
      else if (normalizal(cellaSzoveg(tc)).replace(/\n/g, ' ') !== mezo.kerdes) hibak.push(`${mezo.azonosito}: a kérdés szövege eltér`);
    }
    if (mezo.hely && !cella(dom, mezo.hely)) hibak.push(`${mezo.azonosito}: nincs meg a válasz cellája`);
    if (mezo.minta && !bekSzovegek.some((s) => s.includes(mezo.minta))) hibak.push(`${mezo.azonosito}: nincs meg a helykitöltő: ${mezo.minta}`);
  }
  return hibak;
}
