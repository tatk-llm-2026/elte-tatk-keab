// Word (.docx) fájlok olvasása és írása: zip-konténer + WordprocessingML XML.
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

export const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

export function docxMegnyit(buffer) {
  const fajlok = unzipSync(new Uint8Array(buffer));
  if (!fajlok['word/document.xml']) throw new Error('Nem Word-dokumentum: hiányzik a word/document.xml');
  const dom = new DOMParser().parseFromString(strFromU8(fajlok['word/document.xml']), 'text/xml');
  return { fajlok, dom };
}

export function docxMent({ fajlok, dom }) {
  const kimenet = { ...fajlok, 'word/document.xml': strToU8(new XMLSerializer().serializeToString(dom)) };
  return Buffer.from(zipSync(kimenet, { level: 6 }));
}

export function gyerekek(elem, nev) {
  const eredmeny = [];
  for (let n = elem.firstChild; n; n = n.nextSibling) {
    if (n.nodeType === 1 && n.namespaceURI === W && n.localName === nev) eredmeny.push(n);
  }
  return eredmeny;
}

export function test(dom) {
  return dom.getElementsByTagNameNS(W, 'body')[0];
}

// Egy bekezdés szövege (a w:t elemek összefűzve, a tabulátorok és sortörések megtartásával).
export function bekezdesSzoveg(p) {
  let szoveg = '';
  const bejar = (n) => {
    for (let c = n.firstChild; c; c = c.nextSibling) {
      if (c.nodeType !== 1) continue;
      if (c.namespaceURI === W) {
        if (c.localName === 't') szoveg += c.textContent;
        else if (c.localName === 'tab') szoveg += '\t';
        else if (c.localName === 'br' || c.localName === 'cr') szoveg += '\n';
        else if (c.localName === 'delText' || c.localName === 'instrText') continue;
        else bejar(c);
      } else {
        bejar(c);
      }
    }
  };
  bejar(p);
  return szoveg;
}

export function cellaSzoveg(tc) {
  return gyerekek(tc, 'p').map(bekezdesSzoveg).join('\n');
}

// A dokumentum törzsének szerkezetes szövege: bekezdések és táblázatok sorrendben.
// Táblázatnál sor- és cellahatárt is jelöl, így a szerkezet változása is látszik.
export function szerkezetesSzoveg(dom) {
  const sorok = [];
  const blokk = (elem) => {
    for (let n = elem.firstChild; n; n = n.nextSibling) {
      if (n.nodeType !== 1 || n.namespaceURI !== W) continue;
      if (n.localName === 'p') sorok.push(bekezdesSzoveg(n));
      else if (n.localName === 'tbl') {
        sorok.push('[táblázat]');
        for (const tr of gyerekek(n, 'tr')) {
          sorok.push('[sor]');
          for (const tc of gyerekek(tr, 'tc')) {
            sorok.push('[cella]');
            blokk(tc);
          }
        }
        sorok.push('[táblázat vége]');
      } else if (n.localName === 'sdt') {
        const tartalom = gyerekek(n, 'sdtContent')[0];
        if (tartalom) blokk(tartalom);
      }
    }
  };
  blokk(test(dom));
  return sorok.join('\n');
}
