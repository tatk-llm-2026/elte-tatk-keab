#!/usr/bin/env node
// Karbantartói szkript: a mezőtérképek előállítása a csomagolt kari űrlapokból.
// A mezők helye itt van leírva; a kérdések szövegét és az ujjlenyomatot az űrlapból olvassa ki.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CSOMAG_GYOKER } from '../src/csomag.js';
import { bekezdesSzoveg, cellaSzoveg, docxMegnyit } from '../src/docx.js';
import { bekezdesek, cella, szerkezetEllenorzes, szoszamKorlat } from '../src/mezoterkep.js';
import { normalizal, ujjlenyomat } from '../src/ujjlenyomat.js';

const CIMEK = {
  '7.1': { hu: 'Kutatásintegritási nyilatkozat', en: 'Statement of research integrity' },
  '7.2': { hu: 'Kutatásintegritási űrlap', en: 'Research integrity application form' },
  '7.4': { hu: 'Adatkezelési terv', en: 'Plan for data processing' },
};

const egySor = (s) => normalizal(s).replace(/\n/g, ' ');

function urlap72(dom, nyelv) {
  const mezok = [];
  const kerdesCella = (tablazat, sor) => ({ tablazat, sor, cella: 1 });
  const kerdesSzoveg = (hely) => egySor(cellaSzoveg(cella(dom, hely)));
  mezok.push({
    azonosito: 'azonosito', tipus: 'bizottsagi', kerdes: egySor(cellaSzoveg(cella(dom, { tablazat: 0, sor: 0, cella: 1 }))),
    kerdesHely: { tablazat: 0, sor: 0, cella: 1 }, hely: { tablazat: 0, sor: 0, cella: 2 },
  });
  for (let sor = 0; sor < 26; sor++) {
    const kerdesHely = kerdesCella(1, sor);
    const kerdes = kerdesSzoveg(kerdesHely);
    const azonosito = String(sor + 1);
    mezok.push({
      azonosito,
      tipus: azonosito === '14' ? 'cella-hozzafuzes' : 'cella',
      kerdes,
      kerdesHely,
      hely: { tablazat: 1, sor, cella: 2 },
      kotelezo: azonosito !== '16',
      szoszam: szoszamKorlat(kerdes),
      ...(azonosito === '11' ? { alapertek: 'mai-datum' } : {}),
    });
  }
  mezok.push({
    azonosito: 'igen-magyarazat-utmutato', tipus: 'utmutato', kerdes: egySor(cellaSzoveg(cella(dom, { tablazat: 2, sor: 0, cella: 1 }))),
    kerdesHely: { tablazat: 2, sor: 0, cella: 1 },
  });
  for (let sor = 1; sor <= 8; sor++) {
    const kerdesHely = kerdesCella(2, sor);
    mezok.push({
      azonosito: String(26 + sor),
      tipus: 'igen-nem',
      kerdes: kerdesSzoveg(kerdesHely),
      kerdesHely,
      hely: { tablazat: 2, sor, cella: 4 },
      nemHely: { tablazat: 2, sor, cella: 2 },
      igenHely: { tablazat: 2, sor, cella: 3 },
      valaszok: nyelv === 'hu' ? { nem: 'NEM', igen: 'IGEN' } : { nem: 'NO', igen: 'YES' },
      kotelezo: true,
    });
  }
  for (let sor = 0; sor < 6; sor++) {
    const kerdesHely = kerdesCella(3, sor);
    mezok.push({
      azonosito: String(35 + sor), tipus: 'cella', kerdes: kerdesSzoveg(kerdesHely), kerdesHely,
      hely: { tablazat: 3, sor, cella: 2 }, kotelezo: false, szoszam: null,
    });
  }
  return mezok;
}

function urlap71(dom, nyelv) {
  const hu = nyelv === 'hu';
  return [
    { azonosito: 'kutatas-cime', tipus: 'helykitolto', kerdes: hu ? 'A kutatás címe' : 'Title of research', minta: hu ? '[kutatás címe]' : '[title of research]', forras: '7.2/6' },
    { azonosito: 'telepules', tipus: 'helykitolto', kerdes: hu ? 'A nyilatkozat kelte: település' : 'Place of the statement', minta: hu ? '[település]' : '[place]', kotelezo: true },
    { azonosito: 'ev', tipus: 'helykitolto', kerdes: hu ? 'Év' : 'Year', minta: hu ? '[év]' : '[year]', alapertek: 'mai-ev' },
    { azonosito: 'ho', tipus: 'helykitolto', kerdes: hu ? 'Hónap' : 'Month', minta: hu ? '[hó]' : '[month]', alapertek: 'mai-honap' },
    { azonosito: 'nap', tipus: 'helykitolto', kerdes: hu ? 'Nap' : 'Day', minta: hu ? '[nap]' : '[day]', alapertek: 'mai-nap' },
    {
      azonosito: 'resztvevok',
      tipus: 'sorok',
      kerdes: hu
        ? 'A kutatás résztvevői (a kutatásban személyes adatot kezelő közreműködők): Név | Neptun kód | Szerepkör'
        : 'Research participants (contributors processing personal data): Name | Neptun ID | Role',
      kerdesHely: { tablazat: 0, sor: 0, cella: 0 },
      fejlec: egySor(cellaSzoveg(cella(dom, { tablazat: 0, sor: 0, cella: 0 }))),
      hely: { tablazat: 0, sor: 1, cella: 0 },
      oszlopok: 3,
      kotelezo: true,
    },
  ].map((m) => (m.tipus === 'sorok' ? { ...m, kerdesHely: undefined } : m));
}

function urlap74(dom, nyelv) {
  const hu = nyelv === 'hu';
  const mezok = [
    { azonosito: 'kutatas-cime', tipus: 'helykitolto', kerdes: hu ? 'A kutatás címe' : 'Title of research', minta: hu ? '[kutatás címe]' : '[title of research]', forras: '7.2/6' },
    { azonosito: 'azonosito', tipus: 'bizottsagi', kerdes: hu ? 'A kutatás azonosítószáma' : 'Registration number of research', minta: hu ? '[a kutatás azonosítószáma]' : '[registration number of research]' },
    {
      azonosito: 'jogszabalyok',
      tipus: 'megerosites',
      kerdes: hu
        ? 'A hivatkozott jogszabályok hatályosságát felülvizsgáltam (igen/nem)'
        : 'I have reviewed the validity of the referred acts of law (yes/no)',
      minta: hu ? '[hivatkozott jogszabályok hatályosságának felülvizsgálata szükséges]' : '[the validity of the referred acts of law needs reviewing]',
      kotelezo: true,
    },
    { azonosito: 'keszult', tipus: 'helykitolto', kerdes: hu ? 'Az adatkezelési terv elkészültének dátuma' : 'Date of document', minta: hu ? '[dokumentum elkészültének dátuma]-n' : '[date of document]', alapertek: 'mai-datum-napjan' },
    {
      azonosito: 'felelos',
      tipus: 'helykitolto',
      kerdes: hu ? 'A felelősséget vállaló vezető: kutatás vagy kutatócsoport' : 'Responsibility: research or research group',
      minta: hu ? '[kutatás / kutatócsoport]' : '[research / research group]',
      valasztas: hu ? ['kutatás', 'kutatócsoport'] : ['research', 'research group'],
      kotelezo: true,
    },
  ];
  // A számozott fejezetek: cím bekezdés, utána szögletes zárójeles útmutató bekezdés.
  const ps = bekezdesek(dom).map((p) => normalizal(bekezdesSzoveg(p)).replace(/\n/g, ' ')).filter(Boolean);
  for (let i = 0; i < ps.length - 1; i++) {
    const cim = /^(\d{1,2})\. (.+)$/.exec(ps[i]);
    if (cim && /^\[.*\]$/.test(ps[i + 1])) {
      mezok.push({
        azonosito: cim[1], tipus: 'bekezdes', kerdes: cim[2], utmutato: ps[i + 1].slice(1, -1),
        minta: ps[i + 1], kotelezo: true,
      });
    }
  }
  return mezok;
}

const EPITOK = { '7.1': urlap71, '7.2': urlap72, '7.4': urlap74 };
let hiba = false;
for (const urlap of ['7.1', '7.2', '7.4']) {
  for (const nyelv of ['hu', 'en']) {
    const fajl = join(CSOMAG_GYOKER, 'dokumentumok', `${urlap}-${nyelv}.docx`);
    const buffer = readFileSync(fajl);
    const { dom } = docxMegnyit(buffer);
    const terkep = {
      dokumentum: `${urlap}-${nyelv}`,
      urlap,
      nyelv,
      cim: CIMEK[urlap][nyelv],
      ujjlenyomat: ujjlenyomat(buffer, 'docx'),
      mezok: EPITOK[urlap](dom, nyelv).map((m) => JSON.parse(JSON.stringify(m))),
    };
    const hibak = szerkezetEllenorzes(dom, terkep);
    if (hibak.length) {
      hiba = true;
      console.error(`${urlap}-${nyelv}:\n  ${hibak.join('\n  ')}`);
    }
    writeFileSync(join(CSOMAG_GYOKER, 'mezoterkepek', `${urlap}-${nyelv}.json`), `${JSON.stringify(terkep, null, 2)}\n`);
    console.log(`${urlap}-${nyelv}: ${terkep.mezok.length} mező`);
  }
}
process.exit(hiba ? 1 : 0);
