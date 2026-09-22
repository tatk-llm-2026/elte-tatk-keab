// A beadott fájlok neve a kari konvenció szerint: "<űrlap címe> (VEZETEKNEV_ÉÉÉÉHHNN).docx".

const CIMEK = {
  hu: {
    '7.1': '7.1 Kutatásintegritási nyilatkozat',
    '7.2': '7.2 Kutatásintegritási űrlap',
    '7.4': '7.4 Adatkezelési terv',
    tajekoztato: 'Tájékoztató és hozzájáruló nyilatkozat',
    valaszlevel: 'Válaszlevél a Bizottság értékelésére',
  },
  en: {
    '7.1': '7.1 Statement of research integrity',
    '7.2': '7.2 Research integrity application form',
    '7.4': '7.4 Plan for data processing',
    tajekoztato: 'Statement of information and consent',
    valaszlevel: 'Response to the Committee evaluation',
  },
};

const CIMZESEK = /^(dr|prof|habil|phd|ph\.d|dsc|csc|mr|mrs|ms|univ|med|jur)\.?,?$/i;

// Vezetéknév a kutatásvezető nevéből. Magyar beadványnál a vezetéknév áll elöl,
// angolnál a végén. A tudományos címek kimaradnak.
export function vezeteknev(nev, nyelv) {
  const tagok = nev
    .replace(/,/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !CIMZESEK.test(t));
  if (!tagok.length) return '';
  return nyelv === 'hu' ? tagok[0] : tagok.at(-1);
}

export function fajlnevResz(szoveg) {
  return szoveg
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^A-Za-z0-9-]+/g, '')
    .toUpperCase();
}

export function datumResz(datum) {
  const k = (n) => String(n).padStart(2, '0');
  return `${datum.getFullYear()}${k(datum.getMonth() + 1)}${k(datum.getDate())}`;
}

export function fajlnev(dokumentum, nyelv, kutatasvezeto, datum) {
  const cim = CIMEK[nyelv]?.[dokumentum];
  if (!cim) throw new Error(`Ismeretlen dokumentum: ${dokumentum} (${nyelv})`);
  const nev = fajlnevResz(vezeteknev(kutatasvezeto ?? '', nyelv)) || (nyelv === 'hu' ? 'KUTATASVEZETO' : 'HEAD-OF-RESEARCH');
  return `${cim} (${nev}_${datumResz(datum)}).docx`;
}
