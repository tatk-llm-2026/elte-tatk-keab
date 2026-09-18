// A szabályzat PDF-ből kinyert szövegének fejezetekre bontása.
// Fejezetcímnek csak az a számozott sor számít, amelynek száma a számozás
// szerint következhet (testvér, első gyerek vagy egy ős következő testvére),
// és rövid. Így a fejezeteken belüli számozott felsorolások nem lesznek címek.

const CIM = /^\s*((?:\d+\.)+)\s+(\S.*?)\s*$/;
const MAX_CIM_HOSSZ = 75;

function kovetkezhet(elozo, szamok) {
  if (elozo.length === 0) return szamok.length === 1 && szamok[0] === 1;
  // első gyerek
  if (szamok.length === elozo.length + 1 && szamok.slice(0, -1).every((s, i) => s === elozo[i]) && szamok.at(-1) === 1) return true;
  // testvér vagy egy ős következő testvére
  if (szamok.length > elozo.length) return false;
  const szint = szamok.length;
  return szamok.slice(0, szint - 1).every((s, i) => s === elozo[i]) && szamok[szint - 1] === elozo[szint - 1] + 1;
}

// A szabályzat utolsó főfejezete a Mellékletek (7.); az utána következő, számozott
// űrlapkérdések már nem fejezetcímek.
export const UTOLSO_FOFEJEZET = 7;

export function fejezetekre(szoveg, utolsoFofejezet = UTOLSO_FOFEJEZET) {
  const sorok = szoveg.replace(/\f/g, '\n').split('\n');
  const fejezetek = [];
  let elozo = [];
  let aktualis = { szam: null, cim: null, szint: 0, sorok: [] };
  for (const sor of sorok) {
    if (/^\s*\d+\s*$/.test(sor)) continue; // oldalszám
    const t = CIM.exec(sor);
    if (t) {
      const szamok = t[1].split('.').filter(Boolean).map(Number);
      if (t[2].length <= MAX_CIM_HOSSZ && szamok[0] <= utolsoFofejezet && kovetkezhet(elozo, szamok)) {
        fejezetek.push(aktualis);
        aktualis = { szam: szamok.join('.'), cim: t[2], szint: szamok.length, sorok: [] };
        elozo = szamok;
        continue;
      }
    }
    aktualis.sorok.push(sor.replace(/\s+$/, ''));
  }
  fejezetek.push(aktualis);
  return fejezetek.filter((f) => f.szam || f.sorok.some((s) => s.trim()));
}

export function markdownba(fejezetek, cim) {
  const reszek = [`# ${cim}\n`];
  for (const f of fejezetek) {
    const torzs = f.sorok
      .map((s) => s.trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    if (f.szam) reszek.push(`${'#'.repeat(Math.min(f.szint + 1, 6))} ${f.szam}. ${f.cim}\n`);
    if (torzs) reszek.push(`${torzs}\n`);
  }
  return reszek.join('\n');
}
