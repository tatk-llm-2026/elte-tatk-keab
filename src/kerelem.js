// A keab/kerelem.md munkaanyag: váz előállítása a mezőtérképekből és beolvasása.
import { mezoterkepBetolt, URLAPOK } from './mezoterkep.js';

export const TAJEKOZTATO = 'tajekoztato';

const SZOVEGEK = {
  hu: {
    cim: 'Kérelem – munkaanyag',
    bevezeto:
      'Ez a kérelem munkaanyaga. Ide kerül minden válasz; a Word-fájlok a beadvány előállításakor készülnek belőle.\n' +
      'A válaszokat szabadon átírhatja. A „## [azonosító]” kezdetű címsorokat ne módosítsa, mert ezek alapján kerülnek a válaszok a Word-űrlap megfelelő helyére.',
    tajekoztato: 'Tájékoztató és hozzájáruló nyilatkozat',
    tajekoztatoUtmutato: 'A résztvevőknek szóló tájékoztató és hozzájáruló nyilatkozat teljes szövege.',
    szoszam: (k) => `Szószám: ${k.min ? `legalább ${k.min}, ` : ''}legfeljebb ${k.max} szó.`,
    igenNem: (v) => `Az első sor: ${v.nem} vagy ${v.igen}. ${v.igen} esetén alatta írja le, hogyan előzi meg a testi és lelki kárt.`,
    valasztas: (l) => `Válasszon: ${l.join(' / ')}.`,
    megerosites: 'Igen, ha felülvizsgálta; ekkor az emlékeztető kikerül a dokumentumból.',
    hozzafuzes: 'Sorolja fel, mely dokumentumokat csatolja; a válasz a sablon szövege alá kerül.',
    sorok: 'Soronként egy személy: Név | Neptun kód | Szerepkör',
    nemKotelezo: 'Ha nem releváns: N/A',
  },
  en: {
    cim: 'Application – working draft',
    bevezeto:
      'This is the working draft of the application. All answers go here; the Word files are generated from it when the submission is produced.\n' +
      'You may edit the answers freely. Do not change the "## [id]" headings: they determine where each answer goes in the Word form.',
    tajekoztato: 'Statement of information and consent',
    tajekoztatoUtmutato: 'The full text of the information and consent statement for participants.',
    szoszam: (k) => `Word count: ${k.min ? `at least ${k.min}, ` : ''}at most ${k.max} words.`,
    igenNem: (v) => `First line: ${v.nem} or ${v.igen}. If ${v.igen}, describe below how you prevent physical and psychological harm.`,
    valasztas: (l) => `Choose: ${l.join(' / ')}.`,
    megerosites: 'Yes, if you have reviewed them; the reminder is then removed from the document.',
    hozzafuzes: 'List the documents you are attaching; the answer is added below the text of the form.',
    sorok: 'One person per line: Name | Neptun ID | Role',
    nemKotelezo: 'If not relevant: N/A',
  },
};

// A munkaanyagba kerülő mezők: amit a kutatónak kell megadnia.
// Nem kerül bele: a Bizottság mezői, az útmutató sorok, a más mezőből átvett
// és az előállításkor automatikusan kitöltött (pl. dátum) mezők.
export function munkaanyagMezo(mezo) {
  return !['bizottsagi', 'utmutato'].includes(mezo.tipus) && !mezo.forras && !mezo.alapertek;
}

function utmutato(mezo, sz) {
  const reszek = [];
  if (mezo.utmutato) reszek.push(mezo.utmutato);
  if (mezo.szoszam) reszek.push(sz.szoszam(mezo.szoszam));
  if (mezo.tipus === 'igen-nem') reszek.push(sz.igenNem(mezo.valaszok));
  if (mezo.valasztas) reszek.push(sz.valasztas(mezo.valasztas));
  if (mezo.tipus === 'megerosites') reszek.push(sz.megerosites);
  if (mezo.tipus === 'cella-hozzafuzes') reszek.push(sz.hozzafuzes);
  if (mezo.tipus === 'sorok') reszek.push(sz.sorok);
  if (mezo.kotelezo === false) reszek.push(sz.nemKotelezo);
  return reszek.length ? `<!-- ${reszek.join(' ')} -->\n` : '';
}

export function vazKeszit(nyelv, terkepBetolto = mezoterkepBetolt) {
  const sz = SZOVEGEK[nyelv];
  if (!sz) throw new Error(`Ismeretlen beadványnyelv: ${nyelv}`);
  const reszek = [`<!-- kutetika-kerelem nyelv=${nyelv} -->\n# ${sz.cim}\n\n<!--\n${sz.bevezeto}\n-->\n`];
  for (const urlap of URLAPOK) {
    const terkep = terkepBetolto(urlap, nyelv);
    reszek.push(`# ${urlap} ${terkep.cim}\n`);
    for (const mezo of terkep.mezok.filter(munkaanyagMezo)) {
      reszek.push(`## [${mezo.azonosito}] ${mezo.kerdes}\n${utmutato(mezo, sz)}\n`);
    }
  }
  reszek.push(`# ${sz.tajekoztato}\n<!-- ${sz.tajekoztatoUtmutato} -->\n\n`);
  return reszek.join('\n');
}

const MEGJEGYZES = /<!--[\s\S]*?-->/g;
// Az XML 1.0-ban nem megengedett karakterek (pl. Wordből, PDF-ből bemásolt vezérlőkarakterek):
// ezekkel a Word-fájl nem nyílna meg.
const TILTOTT_KARAKTER = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;
const TAJEKOZTATO_CIMEK = Object.values(SZOVEGEK).map((sz) => sz.tajekoztato);

// Beolvasás: { nyelv, valaszok: { '7.2': { '1': '...' } }, tajekoztato, hibak: [...] }
export function beolvas(szoveg, terkepBetolto = mezoterkepBetolt) {
  // Windows-sorvégek, BOM, macOS-en bontott ékezetek (NFD), tiltott vezérlőkarakterek.
  szoveg = szoveg.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').normalize('NFC').replace(TILTOTT_KARAKTER, '');
  const nyelvJel = /<!--\s*kutetika-kerelem\s+nyelv=(hu|en)\s*-->/.exec(szoveg);
  const hibak = [];
  if (!nyelvJel) {
    return { nyelv: null, valaszok: {}, tajekoztato: '', hibak: ['Hiányzik a munkaanyag első sora (kutetika-kerelem nyelv=…).'] };
  }
  const nyelv = nyelvJel[1];
  const terkepek = Object.fromEntries(URLAPOK.map((u) => [u, terkepBetolto(u, nyelv)]));
  const valaszok = Object.fromEntries(URLAPOK.map((u) => [u, {}]));
  let tajekoztato = '';

  let urlap = null; // aktuális űrlap, vagy TAJEKOZTATO
  let mezo = null;
  let puffer = [];
  const lezar = () => {
    const tartalom = puffer.join('\n').replace(MEGJEGYZES, '').trim();
    if (urlap === TAJEKOZTATO) tajekoztato = tartalom;
    else if (urlap && mezo) {
      if (mezo in valaszok[urlap]) hibak.push(`A ${urlap} űrlap [${mezo}] mezője kétszer szerepel; mindkét válasz megmaradt, egybefűzve.`);
      valaszok[urlap][mezo] = mezo in valaszok[urlap] ? `${valaszok[urlap][mezo]}\n\n${tartalom}`.trim() : tartalom;
    }
    puffer = [];
  };

  for (const sor of szoveg.replace(MEGJEGYZES, (m) => m.replace(/^#/gm, '\\#')).split('\n')) {
    const fo = /^# (.+)$/.exec(sor);
    // A tájékoztató az utolsó fejezet: benne a „# ” sor a tájékoztató saját címe, nem új fejezet.
    if (fo && urlap !== TAJEKOZTATO) {
      lezar();
      mezo = null;
      const u = /^(7\.\d)\s/.exec(fo[1]);
      if (u && terkepek[u[1]]) urlap = u[1];
      else if (TAJEKOZTATO_CIMEK.includes(fo[1].trim())) urlap = TAJEKOZTATO;
      else {
        if (urlap !== null || fo[1].trim() !== SZOVEGEK[nyelv].cim) hibak.push(`Felismerhetetlen fejezetcím: „# ${fo[1]}”; az alatta lévő szöveg nem kerül a beadványba.`);
        urlap = null;
      }
      continue;
    }
    const al = /^## (.*)$/.exec(sor);
    if (al && urlap && urlap !== TAJEKOZTATO) {
      lezar();
      const azon = /^\[([^\]]+)\]/.exec(al[1]);
      const ismert = azon && terkepek[urlap].mezok.some((m) => m.azonosito === azon[1] && munkaanyagMezo(m));
      if (ismert) mezo = azon[1];
      else {
        mezo = null;
        hibak.push(`Felismerhetetlen mezőcím a ${urlap} űrlapnál: „## ${al[1]}”`);
      }
      continue;
    }
    puffer.push(sor);
  }
  lezar();

  for (const u of URLAPOK) {
    for (const m of terkepek[u].mezok.filter(munkaanyagMezo)) {
      if (!(m.azonosito in valaszok[u])) hibak.push(`Hiányzik a ${u} űrlap [${m.azonosito}] mezőjének címsora.`);
    }
  }
  return { nyelv, valaszok, tajekoztato, hibak };
}

export function szoszam(szoveg) {
  return (szoveg.match(/[\p{L}\p{N}][\p{L}\p{N}'’.@\-/]*/gu) ?? []).length;
}
