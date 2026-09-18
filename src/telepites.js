// A kutetika telepítése a kutató projektjébe.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { CSOMAG_GYOKER, csomagJson, PROGRAM_MAPPA } from './csomag.js';
import { ir, naplo, olvas, zarol } from './munkafolyamat.js';

export { PROGRAM_MAPPA };

export const SKILL_HELYEK = ['.claude/skills', '.agents/skills', '.github/skills'];
export const BLOKK_KEZDET = '<!-- kutetika:kezdet -->';
export const BLOKK_VEG = '<!-- kutetika:veg -->';
// A CLAUDE.md saját jelölőt kap: ha a CLAUDE.md az AGENTS.md-re mutat (vagy fordítva),
// a két blokk így nem írhatja felül egymást.
export const CLAUDE_KEZDET = '<!-- kutetika:claude-kezdet -->';
export const CLAUDE_VEG = '<!-- kutetika:claude-veg -->';

const FUGGOSEGEK = ['fflate', '@xmldom/xmldom'];

function fuggosegKonyvtar(nev, kiindulo) {
  for (let d = kiindulo; ; d = dirname(d)) {
    const jelolt = join(d, 'node_modules', nev);
    if (existsSync(join(jelolt, 'package.json'))) return jelolt;
    if (dirname(d) === d) throw new Error(`Nem található a(z) ${nev} csomag.`);
  }
}

// A kutató beállításai (pl. hol vannak a nyers adatok). A kutató is szerkesztheti,
// de az asszisztens a nyers-adat paranccsal írja, hogy az AGENTS.md is frissüljön.
export const BEALLITASOK = 'keab/beallitasok.json';

export function beallitasOlvas(cel) {
  try {
    const b = JSON.parse(olvas(cel, BEALLITASOK).toString('utf8').replace(/^\uFEFF/, ''));
    return b && typeof b === 'object' && !Array.isArray(b) ? b : {};
  } catch { return {}; }
}

function nyersAdatSor(helyek) {
  if (Array.isArray(helyek) && helyek.length) {
    return `- Raw research data in this project (recorded by the researcher in \`${BEALLITASOK}\`): ${helyek.map((h) => `\`${h}\``).join(', ')}. Also treat as raw data any other file with responses, recordings, transcripts or datasets.`;
  }
  if (Array.isArray(helyek)) {
    return `- The researcher stated that this project contains no raw research data (\`${BEALLITASOK}\`). If you still find responses, recordings, transcripts or datasets, treat them as raw data.`;
  }
  return `- Where the raw research data are kept has not been recorded yet. Before reading anything beyond the project description and the research instruments, ask the researcher which folders or files contain raw data, and record the answer with \`node ${PROGRAM_MAPPA}/bin/kutetika.js nyers-adat . '{"helyek":["<folder or file>", …]}'\` (an empty list if there is none). Until then treat any file that may contain responses, recordings, transcripts or datasets as raw data.`;
}

export function agentsBlokk(verzio, helyek) {
  return `${BLOKK_KEZDET}
## kutetika – ELTE TáTK research ethics application (KEAB)

This project uses kutetika ${verzio}. Its skills (\`kutetika-engedely\`, \`kutetika-kerelem\`, \`kutetika-biralat\`) guide the researcher through the KEAB ethics application. The faculty documents, field maps and the helper program (\`node ${PROGRAM_MAPPA}/bin/kutetika.js\`) are in \`${PROGRAM_MAPPA}/\`; do not edit them by hand. The application itself (working draft, decisions, Word files) is written in \`keab/\`.

Talk to the researcher in the language they use. The researcher is responsible for every decision; warn, never block.

### Research data protection

- You may read the project description and the research instruments (questionnaires, interview guides, information sheets, recruitment texts) without asking.
${nyersAdatSor(helyek)}
- Do not read raw research data by default.
- If the ethics application genuinely needs something from raw data (e.g. whether a dataset is truly anonymous, or what kinds of data it contains), first tell the researcher which file you want to read and why, and that its content will be sent to the AI provider. Read it only after the researcher explicitly agrees for this occasion and this file. Read only what is needed (e.g. column names, not responses).
- If the researcher declines, do not read it; ask questions instead.
- Record every such permission in \`keab/dontesek.md\`.
- If the data may contain personal data, warn the researcher that sending it to the AI provider is itself data processing and must appear in the data processing plan (7.4).
${BLOKK_VEG}`;
}

export function claudeBlokk() {
  return `${CLAUDE_KEZDET}\n@AGENTS.md\n${CLAUDE_VEG}`;
}

// A jelölő csak akkor számít, ha egyedül áll a sorában; a szövegben idézett jelölő nem.
function jeloloSorok(szoveg, jelolo) {
  const helyek = [];
  const minta = /[^\r\n]*/g;
  for (let m; (m = minta.exec(szoveg)) !== null; minta.lastIndex += 1) {
    if (m[0].trim() === jelolo) helyek.push(m.index + m[0].indexOf(jelolo));
    if (minta.lastIndex >= szoveg.length) break;
  }
  return helyek;
}

export function agentsFrissit(szoveg, blokk, { kezdetJelolo = BLOKK_KEZDET, vegJelolo = BLOKK_VEG } = {}) {
  const sorveg = szoveg?.includes('\r\n') ? '\r\n' : '\n';
  blokk = blokk.replace(/\r?\n/g, sorveg);
  if (szoveg == null || szoveg === '') return `${blokk}${sorveg}`;
  const kezdetek = jeloloSorok(szoveg, kezdetJelolo);
  const vegek = jeloloSorok(szoveg, vegJelolo);
  if (kezdetek.length === 1 && vegek.length === 1 && vegek[0] > kezdetek[0]) {
    return szoveg.slice(0, kezdetek[0]) + blokk + szoveg.slice(vegek[0] + vegJelolo.length);
  }
  if (kezdetek.length || vegek.length) {
    throw new Error(`A kutetika-blokk jelölői (${kezdetJelolo}, ${vegJelolo}) sérültek vagy többször szerepelnek. Javítsd kézzel, hogy pontosan egy blokk maradjon, vagy töröld mindkét jelölőt, és futtasd újra.`);
  }
  const elvalaszto = szoveg.endsWith('\n') ? sorveg : sorveg + sorveg;
  return `${szoveg}${elvalaszto}${blokk}${sorveg}`;
}

export function telepit(cel, { csomagGyoker = CSOMAG_GYOKER } = {}) {
  const pkg = csomagJson();
  const irt = [];

  // Skillek a három asszisztens helyére; csak a kutetika saját skilljei cserélődnek.
  const skillek = readdirSync(join(csomagGyoker, 'skills'), { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith('kutetika-'))
    .map((e) => e.name);
  for (const hely of SKILL_HELYEK) {
    for (const skill of skillek) {
      const hova = join(cel, hely, skill);
      rmSync(hova, { recursive: true, force: true });
      mkdirSync(dirname(hova), { recursive: true });
      cpSync(join(csomagGyoker, 'skills', skill), hova, { recursive: true, dereference: true });
      irt.push(relative(cel, hova));
    }
  }

  // A program a kari dokumentumokkal és a mezőtérképekkel a keab/.eszkoz mappába.
  // Így a projekt önálló: a skillek a telepített változatot hívják, internet nélkül is.
  const program = join(cel, PROGRAM_MAPPA);
  rmSync(program, { recursive: true, force: true });
  for (const mappa of ['bin', 'src', 'dokumentumok', 'mezoterkepek']) {
    cpSync(join(csomagGyoker, mappa), join(program, mappa), { recursive: true, dereference: true });
  }
  writeFileSync(join(program, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);
  for (const nev of FUGGOSEGEK) {
    // dereference: pnpm-szerű telepítésnél a függőség a gyorsítótárra mutató link, nem mappa.
    cpSync(fuggosegKonyvtar(nev, csomagGyoker), join(program, 'node_modules', nev), { recursive: true, dereference: true });
  }
  irt.push(`${PROGRAM_MAPPA}/`);

  irt.push(...utasitasokIr(cel, pkg.version));
  return { verzio: pkg.version, skillek, irt };
}

// Az AGENTS.md és a CLAUDE.md kutetika-blokkja; a nyers adatok helyét a beállításokból veszi.
export function utasitasokIr(cel, verzio) {
  const irt = [];
  const agentsUt = join(cel, 'AGENTS.md');
  const claudeUt = join(cel, 'CLAUDE.md');
  // Mindkettőt előbb kiszámoljuk, hogy sérült jelölőnél egyik fájl se módosuljon.
  const regi = existsSync(agentsUt) ? readFileSync(agentsUt, 'utf8') : null;
  const ujAgents = agentsFrissit(regi, agentsBlokk(verzio, beallitasOlvas(cel).nyersAdat));
  // Ha a CLAUDE.md ugyanaz a fájl, mint az AGENTS.md (link), a szabályok már benne vannak.
  const ugyanaz = existsSync(claudeUt) && existsSync(agentsUt) && realpathSync(claudeUt) === realpathSync(agentsUt);
  const claudeRegi = !ugyanaz && existsSync(claudeUt) ? readFileSync(claudeUt, 'utf8') : null;
  const ujClaude = ugyanaz ? null : agentsFrissit(claudeRegi, claudeBlokk(), { kezdetJelolo: CLAUDE_KEZDET, vegJelolo: CLAUDE_VEG });
  writeFileSync(agentsUt, ujAgents);
  irt.push('AGENTS.md');
  if (!ugyanaz) {
    writeFileSync(claudeUt, ujClaude);
    irt.push('CLAUDE.md');
  }
  return irt;
}

// A kutató megadja, hol vannak a nyers adatok; bekerül a beállításokba, a döntésnaplóba és az AGENTS.md-be.
export async function nyersAdatRogzit(root, { helyek } = {}) {
  return zarol(root, () => {
    if (!Array.isArray(helyek) || helyek.some((h) => typeof h !== 'string' || !h.trim() || h.includes('..') || /^([a-zA-Z]:)?[\\/]/.test(h))) {
      throw new Error('A helyek a projekten belüli mappák vagy fájlok listája legyen (pl. ["data/", "interjuk/"]); üres lista, ha nincs nyers adat.');
    }
    const lista = [...new Set(helyek.map((h) => h.trim().replace(/\\/g, '/')))];
    const b = beallitasOlvas(root);
    b.nyersAdat = lista;
    ir(root, BEALLITASOK, `${JSON.stringify(b, null, 2)}\n`);
    naplo(root, { tipus: 'nyers-adat-helye', kutatoiDontes: lista });
    let verzio;
    try { verzio = JSON.parse(olvas(join(root, PROGRAM_MAPPA), 'package.json')).version; } catch { verzio = csomagJson().version; }
    utasitasokIr(root, verzio);
    return { allapot: 'rogzitve', nyersAdat: lista };
  });
}

export function zaroUzenet({ verzio, skillek }) {
  return `
A kutetika ${verzio} bekerült ebbe a projektbe.

Mi került a projektbe:
  - ${skillek.length} skill a Claude Code, a Codex és a Copilot számára
    (.claude/skills, .agents/skills, .github/skills)
  - a kar hivatalos űrlapjai és szabályzata, magyarul és angolul (keab/.eszkoz/)
  - az adatvédelmi szabály az AGENTS.md végén, a Claude Code a CLAUDE.md-ből tölti be

Hogyan tovább:
  Nyisd meg ezt a mappát az AI-asszisztensedben (Claude Code, Codex vagy Copilot),
  és írd be például:
    kell nekem etikai engedély?
    csináljuk meg a kérelmet
    nézd át, mielőtt elküldöm

A kérelem a keab/ mappában készül. A beküldés a kutatásvezető feladata.

---
kutetika ${verzio} has been added to this project. Open this folder in your AI
assistant (Claude Code, Codex or Copilot) and ask, for example:
"do I need ethics approval?" or "let's prepare the application".
`;
}
