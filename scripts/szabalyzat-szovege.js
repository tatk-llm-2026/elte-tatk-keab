#!/usr/bin/env node
// Karbantartói szkript: a szabályzat PDF-jeiből fejezetekre bontott Markdown szöveg.
// A pdftotext (poppler) csak a kiadás előkészítéséhez kell, a kutató gépén nem.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CSOMAG_GYOKER } from '../src/csomag.js';
import { fejezetekre, markdownba } from '../src/szabalyzat.js';

const CIMEK = {
  hu: 'ELTE TáTK Kutatásintegritási, kutatásetikai és adatkezelési szabályzat',
  en: 'ELTE TáTK Regulations on research integrity, research ethics and data processing',
};

for (const nyelv of ['hu', 'en']) {
  const pdf = join(CSOMAG_GYOKER, 'dokumentumok', `szabalyzat-${nyelv}.pdf`);
  const szoveg = execFileSync('pdftotext', ['-layout', pdf, '-'], { encoding: 'utf8', maxBuffer: 50e6 });
  const fejezetek = fejezetekre(szoveg);
  writeFileSync(join(CSOMAG_GYOKER, 'dokumentumok', `szabalyzat-${nyelv}.md`), markdownba(fejezetek, CIMEK[nyelv]));
  console.log(`${nyelv}: ${fejezetek.filter((f) => f.szam).map((f) => f.szam).join(' ')}`);
}
