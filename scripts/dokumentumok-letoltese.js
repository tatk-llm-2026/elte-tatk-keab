#!/usr/bin/env node
// Karbantartói szkript: letölti a kar oldaláról a csomagba kerülő dokumentumokat,
// majd frissíti a jegyzéket és a package.json ujjlenyomatait.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { KAR_OLDAL, KARI_DOKUMENTUMOK, letolt, linkekKeresese } from '../src/kar.js';
import { CSOMAG_GYOKER } from '../src/csomag.js';
import { csomagUjjlenyomatok, jegyzekKeszit } from '../src/jegyzek.js';

const cel = join(CSOMAG_GYOKER, 'dokumentumok');
mkdirSync(cel, { recursive: true });

const html = (await letolt(KAR_OLDAL)).toString('utf8');
const linkek = linkekKeresese(html);
const hianyzik = KARI_DOKUMENTUMOK.filter((dok) => !linkek[dok.azonosito]);
if (hianyzik.length) {
  console.error(`Nem található link: ${hianyzik.map((d) => d.azonosito).join(', ')}`);
  process.exit(1);
}
for (const dok of KARI_DOKUMENTUMOK) {
  writeFileSync(join(cel, dok.fajl), await letolt(linkek[dok.azonosito]));
  console.log(`${dok.azonosito} <- ${linkek[dok.azonosito]}`);
}

const pkgUt = join(CSOMAG_GYOKER, 'package.json');
const pkg = JSON.parse(readFileSync(pkgUt, 'utf8'));
const jegyzek = jegyzekKeszit(cel, linkek, pkg.version);
writeFileSync(join(cel, 'jegyzek.json'), `${JSON.stringify(jegyzek, null, 2)}\n`);
pkg.kutetika = { ...(pkg.kutetika ?? {}), dokumentumok: csomagUjjlenyomatok(jegyzek) };
writeFileSync(pkgUt, `${JSON.stringify(pkg, null, 2)}\n`);
console.log('jegyzek.json és package.json frissítve');
