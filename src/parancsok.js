import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { regisztral } from './cli.js';
import { nyersAdatRogzit, telepit, zaroUzenet } from './telepites.js';
import { eloallit, munkaanyagBiralat } from './eloallitas.js';
import { allapot, felulbiral } from './ellenorzes.js';
import { biralatFolytat, biralatRogzit, engedelyRogzit } from './biralat.js';
import { frissitesEllenoriz } from './frissites.js';
import { atdolgozasKezd, wordBeolvas } from './atdolgozas.js';
import { objektum, vazIr } from './munkafolyamat.js';

export function initCel(args, { otthon = homedir() } = {}) {
  if (args.length > 1 || args.some((a) => a.startsWith('-'))) throw new Error('Használat: kutetika init [projektmappa]');
  const cel = resolve(args[0] ?? process.cwd());
  if (!existsSync(cel) || !statSync(cel).isDirectory()) throw new Error(`Nincs ilyen mappa: ${cel}. Előbb hozd létre, vagy lépj be a projekted mappájába.`);
  // A saját (home) mappában a .claude/skills és a CLAUDE.md minden projektre hatna.
  if (realpathSync(cel) === realpathSync(otthon)) throw new Error(`A kutetikát a kutatásod mappájába telepítsd, ne a saját (felhasználói) mappádba (${cel}).`);
  return cel;
}

regisztral('init', async (args) => {
  const cel = initCel(args);
  process.stdout.write(`Telepítés ide: ${cel}\n`);
  const eredmeny = telepit(cel);
  process.stdout.write(zaroUzenet(eredmeny));
  return 0;
});

const KOZOS = ['asszisztens', 'subagent', 'mellekletek'];
const MUVELETEK = {
  vaz: { fut: vazIr, kulcsok: ['nyelv'] },
  beolvas: { fut: wordBeolvas, kulcsok: ['nyelv', 'fajlok'] },
  'atdolgozas-kezd': { fut: atdolgozasKezd, kulcsok: ['ertekelolap', 'datum', 'beadott', 'azonosito', 'dontes', 'visszakuldes'] },
  'nyers-adat': { fut: nyersAdatRogzit, kulcsok: ['helyek'] },
  eloallit: { fut: eloallit, kulcsok: [...KOZOS, 'datum', 'felulirasMegerosites'] },
  'munkaanyag-biralat': { fut: munkaanyagBiralat, kulcsok: KOZOS },
  'biralat-folytat': { fut: biralatFolytat, kulcsok: ['asszisztens', 'subagent'] },
  'biralat-rogzit': { fut: biralatRogzit, kulcsok: ['token', 'keres', 'asszisztens', 'mod', 'kifogasok'] },
  'kulso-engedely': { fut: engedelyRogzit, kulcsok: ['asszisztens', 'engedely'] },
  felulbiral: { fut: felulbiral, kulcsok: ['token', 'dontesek'] },
  allapot: { fut: allapot, kulcsok: [] },
  frissites: { fut: frissitesEllenoriz, kulcsok: ['force'] },
};

for (const [nev, { fut, kulcsok }] of Object.entries(MUVELETEK)) {
  regisztral(nev, async (args) => {
    try {
      if (args.length > 2) throw new Error('Használat: kutetika parancs [projektmappa] [JSON-beállítások]');
      const [root = process.cwd(), json = '{}'] = args;
      // „@fájl”: a beállítások fájlból (Windows PowerShellben a parancssori JSON idézőjelei elveszhetnek).
      const options = JSON.parse(json.startsWith('@') ? readFileSync(resolve(json.slice(1)), 'utf8').replace(/^\uFEFF/, '') : json);
      if (!objektum(options) || Object.keys(options).some((k) => !kulcsok.includes(k))) throw new Error(`Megengedett beállítások: ${kulcsok.join(', ') || 'nincs'}`);
      if (options.subagent !== undefined && typeof options.subagent !== 'boolean') throw new Error('A subagent értéke true vagy false legyen.');
      const eredmeny = await fut(root, options);
      process.stdout.write(`${JSON.stringify(eredmeny)}\n`);
      return 0;
    } catch (hiba) {
      process.stdout.write(`${JSON.stringify({ allapot: 'hiba', mehet: false, hiba: hiba.message })}\n`);
      return 1;
    }
  });
}
