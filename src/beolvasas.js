// Korábban beadott, Wordben kitöltött kari űrlap beolvasása a munkaanyagba (átdolgozáshoz).
// Az üres kari űrlappal összevetve olvas: a 7.2-ben a kérdés cellája, a 7.4-ben és a 7.1-ben
// a kari szöveg (fejezetcímek, mondatok) alapján. Ami nem egyértelmű, azt megjelöli.
import { bekezdesSzoveg, cellaSzoveg, docxMegnyit, gyerekek, W } from './docx.js';
import { bekezdesek, cella, tablazatok } from './mezoterkep.js';
import { munkaanyagMezo } from './kerelem.js';
import { normalizal } from './ujjlenyomat.js';

const tiszta = (s) => normalizal(s).replace(/\n/g, ' ');
const regexVedo = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Egy cella válasza: bekezdésenként, üres sorral elválasztva (ahogy a munkaanyagban).
function cellaValasz(tc) {
  return gyerekek(tc, 'p').map((p) => bekezdesSzoveg(p).replace(/[ \t]+$/gm, '').trim()).filter(Boolean).join('\n\n');
}

// Kiemelt (aláhúzott, félkövér vagy színnel kiemelt) szöveg a cellában: így jelöli a kutató
// az IGEN/NEM választ. Az űrlap aláhúzást kér, de sokan félkövérrel jelölnek.
const KIKAPCSOLT = ['0', 'false', 'none'];
function jelolt(tc) {
  return [...tc.getElementsByTagNameNS(W, 'r')].some((r) => {
    const rPr = gyerekek(r, 'rPr')[0];
    if (!rPr || bekezdesSzoveg(r).trim() === '') return false;
    return ['u', 'b', 'highlight'].some((nev) => gyerekek(rPr, nev).some((e) => !KIKAPCSOLT.includes(e.getAttributeNS(W, 'val'))));
  });
}

// A 7.2 mezőinek helye: ha a kérdés a kari helyén van, ott; ha nem (régebbi vagy átszerkesztett
// űrlap), a kérdés szövege alapján keresi, és a válasz a kérdéshez képest ugyanott van.
function athelyezo(dom, mezo) {
  const kh = mezo.kerdesHely;
  const tc = cella(dom, kh);
  if (tc && tiszta(cellaSzoveg(tc)) === mezo.kerdes) return { athelyez: (h) => h, eltolt: false };
  const tbls = tablazatok(dom);
  for (let t = 0; t < tbls.length; t++) {
    const sorok = gyerekek(tbls[t], 'tr');
    for (let s = 0; s < sorok.length; s++) {
      const cellak = gyerekek(sorok[s], 'tc');
      for (let c = 0; c < cellak.length; c++) {
        if (tiszta(cellaSzoveg(cellak[c])) !== mezo.kerdes) continue;
        const d = { tablazat: t - kh.tablazat, sor: s - kh.sor, cella: c - kh.cella };
        return { athelyez: (h) => ({ tablazat: h.tablazat + d.tablazat, sor: h.sor + d.sor, cella: h.cella + d.cella }), eltolt: true };
      }
    }
  }
  return null;
}

// Mintából regex: a kari szöveg szó szerint, a helykitöltők helyén bármi.
// Magyarul a beíráskor „a” → „az” lehet, és a névelős cím idézőjelbe kerülhet.
// szamozas: a fejezetcím sorszáma (pl. „3. ”) eltérhet vagy hiányozhat.
const SORSZAM = /^\d+\.\s*/;
function mintaRegex(szoveg, mintak, nyelv, { szamozas = false } = {}) {
  if (szamozas) szoveg = szoveg.replace(SORSZAM, '');
  const elemek = mintak.filter((m) => szoveg.includes(m)).sort((a, b) => b.length - a.length);
  const csoportok = [];
  let minta = '';
  let i = 0;
  while (i < szoveg.length) {
    const talalt = elemek.find((m) => szoveg.startsWith(m, i));
    if (talalt) {
      if (nyelv === 'hu' && /(^|\s)[Aa] $/.test(minta.replace(/\\/g, ''))) minta = `${minta.slice(0, -1)}z? `;
      minta += '„?(.*?)”?';
      csoportok.push(talalt);
      i += talalt.length;
    } else {
      minta += regexVedo(szoveg[i]);
      i++;
    }
  }
  return { regex: new RegExp(`^${szamozas ? '(?:\\d+\\.\\s*)?' : ''}${minta}$`, 's'), csoportok };
}

function bekezdesLista(dom) {
  return bekezdesek(dom).map((p) => ({ nyers: bekezdesSzoveg(p).replace(/[ \t]+$/gm, '').trim(), t: tiszta(bekezdesSzoveg(p)) }));
}

export function urlapBeolvas(sablonBuffer, kitoltottBuffer, terkep) {
  const sablon = docxMegnyit(sablonBuffer).dom;
  const dom = docxMegnyit(kitoltottBuffer).dom;
  const valaszok = {};
  const ellenorizendo = {};
  const eltolt = [];
  const jel = (mezo, ok) => { ellenorizendo[mezo.azonosito] = ok; };
  const mintak = terkep.mezok.filter((m) => m.minta).map((m) => m.minta);
  const bekezdesMintak = new Set(terkep.mezok.filter((m) => ['bekezdes', 'megerosites'].includes(m.tipus)).map((m) => m.minta));
  const sablonP = bekezdesLista(sablon);
  const kitoltottP = bekezdesLista(dom);

  // Horgony: a helykitöltő előtti/utáni nem üres kari bekezdés (pl. fejezetcím), mintaként illesztve.
  const horgony = (i, irany) => {
    for (let j = i + irany; j >= 0 && j < sablonP.length; j += irany) {
      if (sablonP[j].t && !bekezdesMintak.has(sablonP[j].t)) return mintaRegex(sablonP[j].t, mintak, terkep.nyelv, { szamozas: true }).regex;
    }
    return null;
  };

  for (const mezo of terkep.mezok.filter(munkaanyagMezo)) {
    switch (mezo.tipus) {
      case 'cella':
      case 'cella-hozzafuzes':
      case 'igen-nem': {
        const hely = athelyezo(dom, mezo);
        if (!hely) { jel(mezo, 'A kérdés nem található a Word-fájlban.'); valaszok[mezo.azonosito] = ''; break; }
        if (hely.eltolt) eltolt.push(mezo.azonosito);
        const tc = cella(dom, hely.athelyez(mezo.hely));
        if (!tc) { jel(mezo, 'A válasz cellája nem található.'); valaszok[mezo.azonosito] = ''; break; }
        const sablonTc = cella(sablon, mezo.hely);
        if (mezo.tipus === 'cella-hozzafuzes') {
          const alap = gyerekek(sablonTc, 'p').map((p) => tiszta(bekezdesSzoveg(p))).filter(Boolean);
          const ps = gyerekek(tc, 'p').map((p) => bekezdesSzoveg(p).replace(/[ \t]+$/gm, '').trim()).filter(Boolean);
          let i = 0;
          while (i < alap.length && i < ps.length && tiszta(ps[i]) === alap[i]) i++;
          if (i < alap.length) jel(mezo, 'A cellában a kari szöveg is módosult; a teljes cellatartalom került ide.');
          valaszok[mezo.azonosito] = (i < alap.length ? ps : ps.slice(i)).join('\n\n');
          break;
        }
        let leiras = cellaValasz(tc);
        if (leiras && tiszta(leiras) === tiszta(cellaValasz(sablonTc))) leiras = '';
        if (mezo.tipus === 'cella') { valaszok[mezo.azonosito] = leiras; break; }
        const igenTc = cella(dom, hely.athelyez(mezo.igenHely));
        const nemTc = cella(dom, hely.athelyez(mezo.nemHely));
        let dontes = null;
        if (!igenTc || !nemTc) jel(mezo, 'Az IGEN/NEM cellák nem találhatók.');
        else if (jelolt(cella(sablon, mezo.igenHely)) || jelolt(cella(sablon, mezo.nemHely))) jel(mezo, 'A kari űrlapon is kiemelés van, a választás nem olvasható ki.');
        else {
          const igen = jelolt(igenTc);
          const nem = jelolt(nemTc);
          if (igen !== nem) dontes = igen ? 'igen' : 'nem';
          else jel(mezo, igen ? 'Az IGEN és a NEM is ki van jelölve (aláhúzva vagy félkövérrel).' : 'Sem az IGEN, sem a NEM nincs kijelölve (aláhúzva vagy félkövérrel).');
        }
        valaszok[mezo.azonosito] = [dontes ? mezo.valaszok[dontes] : '', leiras].filter(Boolean).join('\n');
        break;
      }
      case 'sorok': {
        const tbls = tablazatok(dom);
        const t = tbls.findIndex((tbl) => gyerekek(tbl, 'tr').some((tr) => gyerekek(tr, 'tc').some((tc) => tiszta(cellaSzoveg(tc)) === mezo.fejlec)));
        const tbl = tbls[t === -1 ? mezo.hely.tablazat : t];
        if (!tbl) { jel(mezo, 'A táblázat nem található.'); valaszok[mezo.azonosito] = ''; break; }
        if (t === -1) jel(mezo, 'A táblázat fejléce eltér a karitól; a sorokat ellenőrizd.');
        const sablonSorok = gyerekek(cella(sablon, mezo.hely).parentNode.parentNode, 'tr').map((tr) => gyerekek(tr, 'tc').map((tc) => tiszta(cellaSzoveg(tc))).join('|'));
        const sorok = [];
        for (const tr of gyerekek(tbl, 'tr').slice(mezo.hely.sor)) {
          const cellak = gyerekek(tr, 'tc').slice(0, mezo.oszlopok).map((tc) => tiszta(cellaSzoveg(tc)));
          if (cellak.every((c) => !c) || sablonSorok.includes(gyerekek(tr, 'tc').map((tc) => tiszta(cellaSzoveg(tc))).join('|'))) continue;
          sorok.push(cellak.join(' | '));
        }
        valaszok[mezo.azonosito] = sorok.join('\n');
        break;
      }
      case 'helykitolto': {
        const i = sablonP.findIndex((p) => p.t.includes(mezo.minta));
        const { regex, csoportok } = mintaRegex(sablonP[i].t, mintak, terkep.nyelv);
        // A csupa helykitöltőből álló mondat (pl. „[település], [év]. [hó] [nap].”) sok bekezdésre
        // illeszkedne: a környező kari bekezdések között keressük.
        const elotte = horgony(i, -1);
        const utana = horgony(i, 1);
        const a = elotte ? kitoltottP.findIndex((p) => elotte.test(p.t)) : -1;
        const b = utana ? kitoltottP.findIndex((p, j) => j > a && utana.test(p.t)) : -1;
        const jeloltek = kitoltottP.map((p, j) => ({ j, t: regex.exec(p.t) })).filter((v) => v.t);
        const kozte = jeloltek.filter((v) => (a === -1 || v.j > a) && (b === -1 || v.j < b));
        const talalat = (kozte.length ? kozte : jeloltek.length === 1 ? jeloltek : [])[0]?.t;
        if (!talalat) { jel(mezo, 'A mondat, amelybe ez az érték kerül, nem található a Word-fájlban.'); valaszok[mezo.azonosito] = ''; break; }
        const v = talalat[csoportok.indexOf(mezo.minta) + 1].trim();
        valaszok[mezo.azonosito] = v === mezo.minta ? '' : v;
        break;
      }
      case 'bekezdes':
      case 'megerosites': {
        const i = sablonP.findIndex((p) => p.t === mezo.minta);
        const elotte = horgony(i, -1);
        const utana = horgony(i, 1);
        const a = elotte ? kitoltottP.findIndex((p) => elotte.test(p.t)) : -1;
        const b = a === -1 ? -1 : utana ? kitoltottP.findIndex((p, j) => j > a && utana.test(p.t)) : kitoltottP.length;
        if (a === -1 || b === -1) {
          jel(mezo, 'A fejezet nem található a Word-fájlban (a fejezetcím vagy a következő fejezet címe eltér).');
          valaszok[mezo.azonosito] = '';
          break;
        }
        const kozte = kitoltottP.slice(a + 1, b).filter((p) => p.t);
        if (mezo.tipus === 'megerosites') {
          // Az emlékeztető eltűnése nem bizonyítja a felülvizsgálatot: erősítse meg a kutató.
          if (!kozte.some((p) => p.t === mezo.minta)) jel(mezo, 'Az emlékeztető nincs a Word-fájlban. Ha felülvizsgáltad a hivatkozott jogszabályokat, írd ide: igen.');
          valaszok[mezo.azonosito] = '';
          break;
        }
        const reszek = kozte.filter((p) => p.t !== mezo.minta).map((p) => p.nyers);
        valaszok[mezo.azonosito] = reszek.join('\n\n');
        break;
      }
      default:
        jel(mezo, `Ismeretlen mezőtípus: ${mezo.tipus}`);
        valaszok[mezo.azonosito] = '';
    }
  }
  return { valaszok, ellenorizendo, eltolt };
}
