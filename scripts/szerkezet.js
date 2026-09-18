#!/usr/bin/env node
// Karbantartói segéd: kiírja egy Word-űrlap blokkjait (bekezdések, táblázatok, sorok, cellák),
// a mezőtérkép elkészítéséhez.
import { readFileSync } from 'node:fs';
import { cellaSzoveg, bekezdesSzoveg, docxMegnyit, gyerekek, test, W } from '../src/docx.js';

const { dom } = docxMegnyit(readFileSync(process.argv[2]));
const rovid = (s, n = 90) => JSON.stringify(s.length > n ? `${s.slice(0, n)}…` : s);
let ti = 0;
let pi = 0;
for (let n = test(dom).firstChild; n; n = n.nextSibling) {
  if (n.nodeType !== 1 || n.namespaceURI !== W) continue;
  if (n.localName === 'p') {
    const s = bekezdesSzoveg(n);
    if (s.trim()) console.log(`p${pi} ${rovid(s)}`);
    pi++;
  } else if (n.localName === 'tbl') {
    console.log(`T${ti}`);
    gyerekek(n, 'tr').forEach((tr, ri) => {
      const cellak = gyerekek(tr, 'tc');
      console.log(`  T${ti}.R${ri} [${cellak.length}] ${cellak.map((c) => rovid(cellaSzoveg(c), 50)).join(' | ')}`);
    });
    ti++;
  }
}
