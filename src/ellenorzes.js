import { URLAPOK } from './mezoterkep.js';
import { szoszam } from './kerelem.js';
import { igenNemBontas } from './kitoltes.js';
import { docxMegnyit, W } from './docx.js';
import { allapotOlvas, allapotIr, ir, kifogasErvenyes, kifogasokRendez, naplo, objektum, olvas, pillanatEgyezik, szoveg, zarol } from './munkafolyamat.js';

export function mellekletekEllenoriz(lista) {
  if (lista === undefined) return [];
  if (!Array.isArray(lista)) throw new Error('A mellékletek listája tömb legyen.');
  const nevek = new Set();
  for (const m of lista) {
    if (!objektum(m) || !szoveg(m.fajl) || !/^keab\/[^/]+\.(docx|pdf|txt|md)$/i.test(m.fajl)
      || /^(AGENTS|CLAUDE|dontesek|kerelem|bead)\./i.test(m.fajl.slice(5)) || m.fajl.slice(5).startsWith('.')
      || !szoveg(m.hely) || !['kutatasi-eszkoz', 'tajekoztato', 'hozzajarulas', 'toborzas'].includes(m.tipus)
      || m.nemNyersAdat !== true || nevek.has(m.fajl)) throw new Error('A melléklet legyen név szerint megadott, keab/ alatti beadványanyag, nem nyers adat; fajl, hely, tipus és nemNyersAdat:true szükséges.');
    nevek.add(m.fajl);
  }
  return lista;
}

export function formaiEllenorzes(root, { draft, terkepBetolto, frissites, mellekletek, generalt = [], wordok = [] }) {
  const lista = [];
  const hozzaad = (azonosito, hely, problema, sulyossag = 'javitando', szabalyzat = null) => lista.push({ azonosito: `formai:${azonosito}`, hely, problema, sulyossag, szabalyzat });
  for (const [i, hiba] of draft.hibak.entries()) hozzaad(`cimsor:${i}`, 'kerelem.md', hiba);
  for (const u of URLAPOK) {
    for (const m of terkepBetolto(u, draft.nyelv).mezok) {
      if (['bizottsagi', 'utmutato'].includes(m.tipus) || m.alapertek) continue;
      const [forrasU, forrasM] = m.forras?.split('/') ?? [u, m.azonosito];
      const v = draft.valaszok[forrasU]?.[forrasM]?.trim() ?? '';
      const hely = `kerelem.md ${forrasU}/[${forrasM}]`;
      const id = `${u}/${m.azonosito}`;
      if ((m.kotelezo || m.forras) && !v) hozzaad(`ures:${id}`, hely, `Üres kötelező érték: ${m.kerdes}`);
      const n = szoszam(v);
      if (m.szoszam && (n < (m.szoszam.min ?? 0) || n > m.szoszam.max)) hozzaad(`szoszam:${id}`, hely, `Szószám: ${n}; megengedett: ${m.szoszam.min ?? 0}–${m.szoszam.max}.`);
      if (v && m.tipus === 'igen-nem') {
        const { dontes, leiras } = igenNemBontas(v);
        if (!dontes || (dontes === 'igen' && !leiras)) hozzaad(`valasz:${id}`, hely, 'Igen/nem választ, igen esetén magyarázatot is meg kell adni.');
      }
      if (v && m.tipus === 'megerosites' && igenNemBontas(v).dontes !== 'igen') hozzaad(`megerosites:${id}`, hely, 'A felülvizsgálat nincs megerősítve; az emlékeztető a Wordben maradt.');
      if (v && m.valasztas && !m.valasztas.includes(v)) hozzaad(`valasztas:${id}`, hely, `Ismeretlen választás; lehetőségek: ${m.valasztas.join(', ')}.`);
    }
  }
  if (!draft.tajekoztato.trim()) hozzaad('tajekoztato', 'kerelem.md tájékoztató', 'Üres tájékoztató és hozzájáruló nyilatkozat.');
  if (mellekletek === undefined) hozzaad('mellekletjegyzek', 'kerelem.md 7.2/[14], [15], [20], [21]', 'A szükséges mellékletek fájllistája nincs megadva. A kutatóval egyeztetett listát adja át; ha nincs további melléklet, üres listát.');
  const mellekletLista = mellekletekEllenoriz(mellekletek);
  for (const m of mellekletLista) {
    try { if (!olvas(root, m.fajl).length) throw new Error(); } catch { hozzaad(`melleklet:${m.fajl}`, m.hely, `Hiányzó vagy nem olvasható melléklet: ${m.fajl}`, 'sulyos'); }
  }
  for (const f of [...generalt, ...mellekletLista.map((m) => m.fajl)].filter((f) => /\.docx$/i.test(f))) {
    try {
      const { dom } = docxMegnyit(olvas(root, f));
      if (!dom.getElementsByTagNameNS(W, 'body').length) throw new Error();
    } catch { hozzaad(`word:${f}`, f, 'Hiányzó vagy sérült Word-fájl.', 'sulyos'); }
  }
  for (const f of wordok.filter((f) => !generalt.includes(f) && !mellekletLista.some((m) => m.fajl === f))) hozzaad(`regi-kimenet:${f}`, f, 'Korábbi vagy nem besorolt Word-fájl a keab/ mappában; nem része a kijelölt csatolmánylistának.');
  if (['frissites-elerheto', 'nincs-illo-verzio'].includes(frissites?.allapot) || frissites?.elteresek?.length) hozzaad('regi-urlap', 'kari dokumentumok; kerelem.md', 'A kar módosította a dokumentumokat; a beadvány régebbi változattal készült.', 'javitando');
  return kifogasokRendez(lista);
}

export function allapotSzamit(root, s = allapotOlvas(root)) {
  const f = s.futas;
  const alap = { mehet: false, allapot: 'nincs-eloallitas', kifogasok: [], felulbiralasok: [], figyelmeztetesek: [] };
  if (s.serult) return { ...alap, allapot: 'serult-allapot', figyelmeztetesek: ['Sérült ellenőrzési állapot; új előállítás szükséges.'] };
  if (!f) return alap;
  if (!pillanatEgyezik(root, f)) return { ...alap, allapot: 'ervenytelen', figyelmeztetesek: ['A munkaanyag vagy a beadandó fájlok megváltoztak vagy hiányoznak; új előállítás szükséges.'] };
  if (!Array.isArray(f.formai) || !f.formai.every(kifogasErvenyes)) return { ...alap, allapot: 'serult-allapot' };
  const b = f.biralat;
  const kesz = b?.allapot === 'kesz' && b.token === f.token && b.keres === f.keres?.azonosito
    && szoveg(b.keres) && ['kulso', 'subagent', 'uj-beszelgetes'].includes(b.mod)
    && b.asszisztens === f.keres?.asszisztens && b.mod === f.keres?.mod
    && Array.isArray(b.kifogasok) && b.kifogasok.every(kifogasErvenyes);
  const kifogasok = kifogasokRendez([...f.formai, ...(kesz ? b.kifogasok : [])]);
  const felulbiralasok = Array.isArray(f.felulbiralasok) ? f.felulbiralasok.filter((v) => v.token === f.token && szoveg(v.indok) && kifogasok.some((k) => k.azonosito === v.azonosito)) : [];
  const maradt = kifogasok.filter((k) => !felulbiralasok.some((v) => v.azonosito === k.azonosito));
  const teljes = f.tipus === 'vegleges' && Array.isArray(f.generalt) && f.generalt.length === 4
    && f.generalt.every((p) => typeof f.pillanatkep[p] === 'string');
  const mehet = teljes && kesz && !maradt.length;
  return { mehet, allapot: mehet ? 'mehet' : !kesz ? (b?.allapot ?? 'biralatra-var') : f.tipus === 'munkaanyag' ? 'munkaanyag-biralva' : 'kifogasok',
    token: f.token, keres: f.keres, biralat: b, kifogasok, felulbiralasok,
    figyelmeztetesek: [...(f.frissites?.figyelmeztetesek ?? []), ...(f.figyelmeztetesek ?? []), ...(felulbiralasok.length ? ['Felülbírált kifogások maradtak; ez nem garantál etikai engedélyt.'] : [])] };
}

export function beadIr(root, s) {
  const f = s.futas;
  if (!f || f.tipus !== 'vegleges') return;
  const a = allapotSzamit(root, s);
  ir(root, 'keab/bead.md', `# Beadási tudnivalók\n\nCímzett: ELTE TáTK KEAB elnöke, keab@tatk.elte.hu.\nA beküldés a kutatásvezető feladata, elektronikusan, Word formátumban, digitális aláírással.\nHatáridő: a következő bizottsági ülés előtt legalább 10 munkanappal (szabályzat 5.1.2.). Konkrét ülésnapot a Bizottságtól kell megkérdezni.\nForrás: https://tatk.elte.hu/bizottsagok/kutetika\n\nkutetika verzió: ${f.verzio}\n\n## Csatolandók\n${f.csatolando.map((p) => `- ${p}`).join('\n')}\n\n## Felhasznált kari dokumentumok\n${f.dokumentumok.map((d) => `- ${d.azonosito}: ${d.ujjlenyomat}; ${d.forras}`).join('\n')}\n\n## Ellenőrzés\nÁllapot: ${a.allapot}.\nPillanatkép: ${f.token}\nBíráló: ${f.biralat?.asszisztens ?? f.keres?.asszisztens ?? 'nincs'}; mód: ${f.biralat?.mod ?? f.keres?.mod ?? 'nincs'}.\nEz az állapot csak a rögzített fájlbájtokra érvényes; beadás előtt futtasd le újra az állapotellenőrzést (allapot parancs). A fájlok változása érvényteleníti. Nem garantál etikai engedélyt.\n\n${a.figyelmeztetesek.join('\n')}\n\n${a.kifogasok.map((k) => `- ${k.azonosito} (${k.sulyossag}): ${k.hely}: ${k.problema}${k.szabalyzat ? `; ${k.szabalyzat}` : ''}`).join('\n')}\n\n## Kutatói felülbírálások\n${a.felulbiralasok.map((v) => `- ${v.azonosito}: ${v.indok}`).join('\n') || 'Nincs.'}\n`);
}

export async function allapot(root) {
  return zarol(root, () => { const s = allapotOlvas(root); const a = allapotSzamit(root, s); if (!s.serult && s.futas?.tipus === 'vegleges' && Array.isArray(s.futas.csatolando) && Array.isArray(s.futas.dokumentumok)) beadIr(root, s); return a; });
}

export async function felulbiral(root, { token, dontesek } = {}) {
  return zarol(root, () => {
    const s = allapotOlvas(root);
    const a = allapotSzamit(root, s);
    if (s.serult || !s.futas || s.futas.tipus !== 'vegleges' || s.futas.biralat?.allapot !== 'kesz' || a.allapot === 'ervenytelen' || token !== a.token) throw new Error('Csak változatlan, végleges és befejezett bírálat után lehet felülbírálni.');
    if (!Array.isArray(dontesek) || !dontesek.length || dontesek.some((v) => !szoveg(v.indok) || !a.kifogasok.some((k) => k.azonosito === v.azonosito))) throw new Error('Minden felülbírált kifogáshoz kutató által megadott indok szükséges.');
    const lista = dontesek.map((v) => ({ azonosito: v.azonosito, indok: v.indok.trim(), token, idopont: new Date().toISOString() }));
    naplo(root, { tipus: 'felulbiralas', gepiJavaslat: a.kifogasok.filter((k) => lista.some((v) => v.azonosito === k.azonosito)), kutatoiDontes: lista, figyelmeztetes: 'A kifogások ellenére történő továbblépés nem garantál engedélyt.' });
    s.futas.felulbiralasok = [...(s.futas.felulbiralasok ?? []).filter((v) => !lista.some((u) => u.azonosito === v.azonosito)), ...lista];
    allapotIr(root, s);
    beadIr(root, s);
    return allapotSzamit(root, s);
  });
}
