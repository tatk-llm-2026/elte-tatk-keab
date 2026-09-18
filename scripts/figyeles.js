import { appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const JELOLO = '<!-- kutetika:kari-figyeles -->';

export function hibajegyAdatok(eredmeny) {
  if (eredmeny?.allapot === 'egyezik' && eredmeny.elteresek?.length === 0) return null;
  const valtozas = eredmeny?.elteresek?.length > 0;
  return {
    title: valtozas ? 'A kari dokumentumok megváltoztak' : 'A kari dokumentumok ellenőrzése nem sikerült',
    body: `${JELOLO}\n\n${valtozas
      ? `Módosult dokumentumok: ${eredmeny.elteresek.map((d) => d.azonosito).join(', ')}.`
      : 'A heti ellenőrzés nem tudta megállapítani, hogy változtak-e a kari dokumentumok.'}\n\n${(eredmeny?.figyelmeztetesek ?? []).join('\n')}\n\nEllenőrzés: ${eredmeny?.ellenorizve ?? 'nem futott le'}.\nHelyi kutetika-verzió: ${eredmeny?.verzio ?? 'ismeretlen'}.\nIllő kiadás: ${eredmeny?.ujVerzio ?? 'nem ismert'}.\nHibaszakasz: ${eredmeny?.hiba?.szakasz ?? 'nincs'}.\n\nA kar oldalát és a jegyzéket kézzel is ellenőrizni kell. Dokumentumváltozáskor főverzió-emelés szükséges.`,
  };
}

export async function hibajegyBiztosit(github, repository, eredmeny) {
  const adat = hibajegyAdatok(eredmeny);
  if (!adat) return { allapot: 'nem-szukseges' };
  try {
    const hibajegyek = await github.paginate(github.rest.issues.listForRepo, {
      ...repository, state: 'open', per_page: 100,
    });
    const meglevo = hibajegyek.find((issue) => !issue.pull_request && issue.body?.includes(JELOLO));
    if (meglevo) {
      if (meglevo.title !== adat.title || meglevo.body !== adat.body) {
        await github.rest.issues.update({ ...repository, issue_number: meglevo.number, ...adat });
      }
      return { allapot: 'meglevo', szam: meglevo.number };
    }
    const { data } = await github.rest.issues.create({ ...repository, ...adat });
    return { allapot: 'letrehozva', szam: data.number };
  } catch {
    return { allapot: 'hiba', figyelmeztetes: 'A karbantartói hibajegyet nem sikerült létrehozni vagy frissíteni; kézi ellenőrzés szükséges.' };
  }
}

export async function figyeles(projectRoot, options = {}) {
  try {
    const ellenoriz = options.ellenoriz ?? (await import('../src/frissites.js')).frissitesEllenoriz;
    return await ellenoriz(projectRoot, { ...options, csomagGyoker: projectRoot, force: true, cache: false });
  } catch {
    return {
      allapot: 'nem-ellenorizheto', verzio: null, ujVerzio: null, elteresek: [],
      kariUjjlenyomatok: {}, ellenorizve: new Date().toISOString(), gyorsitotar: false,
      folytathato: true, hiba: { szakasz: 'figyeles', uzenet: 'A figyelés nem futott le.' },
      figyelmeztetesek: ['A kari ellenőrzés nem futott le; kézi ellenőrzés szükséges.'],
    };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const eredmeny = await figyeles(process.cwd());
  console.log(JSON.stringify(eredmeny, null, 2));
  if (process.env.GITHUB_OUTPUT) {
    try {
      await appendFile(process.env.GITHUB_OUTPUT, `eredmeny=${JSON.stringify(eredmeny)}\n`);
    } catch {
      console.warn('A figyelés eredményét nem sikerült átadni; kézi ellenőrzés szükséges.');
    }
  }
}
