import { createHash } from 'node:crypto';
import { docxMegnyit, szerkezetesSzoveg } from './docx.js';

export function normalizal(szoveg) {
  return szoveg
    .normalize('NFC')
    .replace(/ /g, ' ')
    .split('\n')
    .map((sor) => sor.replace(/\s+/g, ' ').trim())
    .filter((sor) => sor !== '')
    .join('\n');
}

export function sha256(adat) {
  return createHash('sha256').update(adat).digest('hex');
}

// Word-dokumentumnál a normalizált szerkezetes szövegből, így a puszta újramentés
// nem változtatja meg. PDF-nél a fájl bájtjaiból (lásd design.md, 5. döntés).
export function ujjlenyomat(buffer, tipus) {
  if (tipus === 'docx') return `szoveg-sha256:${sha256(normalizal(szerkezetesSzoveg(docxMegnyit(buffer).dom)))}`;
  if (tipus === 'pdf') return `fajl-sha256:${sha256(buffer)}`;
  throw new Error(`Ismeretlen dokumentumtípus: ${tipus}`);
}
