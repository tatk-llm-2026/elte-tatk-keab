// A válaszok beírása a kari Word-űrlapba a mezőtérkép alapján.
import { bekezdesSzoveg, docxMegnyit, docxMent, gyerekek, W } from './docx.js';
import { bekezdesek, cella, szerkezetEllenorzes } from './mezoterkep.js';
import { normalizal, ujjlenyomat } from './ujjlenyomat.js';

const XML_NS = 'http://www.w3.org/XML/1998/namespace';

// A w:rPr gyerekeinek kötelező sorrendje (ECMA-376, CT_RPr).
const RPR_SORREND = [
  'rStyle', 'rFonts', 'b', 'bCs', 'i', 'iCs', 'caps', 'smallCaps', 'strike', 'dstrike', 'outline', 'shadow', 'emboss',
  'imprint', 'noProof', 'snapToGrid', 'vanish', 'webHidden', 'color', 'spacing', 'w', 'kern', 'position', 'sz', 'szCs',
  'highlight', 'u', 'effect', 'bdr', 'shd', 'fitText', 'vertAlign', 'rtl', 'cs', 'em', 'lang', 'eastAsianLayout',
  'specVanish', 'oMath',
];

const HONAPOK = {
  hu: ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

// „-án/-én” rag a nap számához (1-jén, 2-án, 3-án, … 30-án, 31-én).
function napRag(nap) {
  if (nap === 1) return 'jén';
  const an = new Set([2, 3, 6, 8, 13, 16, 18, 20, 23, 26, 28, 30]);
  return an.has(nap) ? 'án' : 'én';
}

export function datumSzoveg(datum, nyelv) {
  const ev = datum.getFullYear();
  const ho = HONAPOK[nyelv][datum.getMonth()];
  const nap = datum.getDate();
  return nyelv === 'hu' ? `${ev}. ${ho} ${nap}.` : `${nap} ${ho} ${ev}`;
}

function alapertek(kulcs, datum, nyelv) {
  switch (kulcs) {
    case 'mai-datum': return datumSzoveg(datum, nyelv);
    case 'mai-datum-napjan':
      return nyelv === 'hu' ? `${datumSzoveg(datum, nyelv).slice(0, -1)}-${napRag(datum.getDate())}` : datumSzoveg(datum, nyelv);
    case 'mai-ev': return String(datum.getFullYear());
    case 'mai-honap': return HONAPOK[nyelv][datum.getMonth()];
    case 'mai-nap': return String(datum.getDate());
    default: throw new Error(`Ismeretlen alapérték: ${kulcs}`);
  }
}

// --- XML segédek ---

function elem(dom, nev) {
  return dom.createElementNS(W, `w:${nev}`);
}

function rPrRendez(rPr, gyerek) {
  const hely = RPR_SORREND.indexOf(gyerek.localName);
  for (let n = rPr.firstChild; n; n = n.nextSibling) {
    if (n.nodeType === 1 && RPR_SORREND.indexOf(n.localName) > hely) {
      rPr.insertBefore(gyerek, n);
      return;
    }
  }
  rPr.appendChild(gyerek);
}

function rPrElem(dom, run) {
  let rPr = gyerekek(run, 'rPr')[0];
  if (!rPr) {
    rPr = elem(dom, 'rPr');
    run.insertBefore(rPr, run.firstChild);
  }
  return rPr;
}

// A helykitöltők dőlt betűsek; a válasz ne örökölje.
function dontesNelkul(rPr) {
  if (!rPr) return rPr;
  for (const nev of ['i', 'iCs']) for (const g of gyerekek(rPr, nev)) rPr.removeChild(g);
  return rPr;
}

function kiemel(dom, run) {
  const rPr = rPrElem(dom, run);
  if (!gyerekek(rPr, 'b').length) rPrRendez(rPr, elem(dom, 'b'));
  if (!gyerekek(rPr, 'u').length) {
    const u = elem(dom, 'u');
    u.setAttributeNS(W, 'w:val', 'single');
    rPrRendez(rPr, u);
  }
}

function szovegElem(dom, szoveg) {
  const t = elem(dom, 't');
  t.setAttributeNS(XML_NS, 'xml:space', 'preserve');
  t.appendChild(dom.createTextNode(szoveg));
  return t;
}

// Egy futás (w:r) a megadott szöveggel; a sortörések w:br elemek lesznek.
function futas(dom, szoveg, rPrMinta) {
  const r = elem(dom, 'r');
  if (rPrMinta) r.appendChild(dontesNelkul(rPrMinta.cloneNode(true)));
  szoveg.split('\n').forEach((sor, i) => {
    if (i > 0) r.appendChild(elem(dom, 'br'));
    r.appendChild(szovegElem(dom, sor));
  });
  return r;
}

// A bekezdés futásainak formázási mintája: az első futás rPr-je, vagy a bekezdésjel rPr-je.
function rPrMinta(dom, p) {
  const elsoFutas = gyerekek(p, 'r')[0];
  const futasRpr = elsoFutas && gyerekek(elsoFutas, 'rPr')[0];
  if (futasRpr) return futasRpr;
  const pPr = gyerekek(p, 'pPr')[0];
  const jelRpr = pPr && gyerekek(pPr, 'rPr')[0];
  if (!jelRpr) return null;
  const rPr = elem(dom, 'rPr');
  for (let n = jelRpr.firstChild; n; n = n.nextSibling) rPr.appendChild(n.cloneNode(true));
  return rPr;
}

function ujBekezdes(dom, mintaBekezdes, szoveg) {
  const p = elem(dom, 'p');
  const pPr = gyerekek(mintaBekezdes, 'pPr')[0];
  if (pPr) {
    const masolat = pPr.cloneNode(true);
    dontesNelkul(gyerekek(masolat, 'rPr')[0]);
    p.appendChild(masolat);
  }
  if (szoveg !== '') p.appendChild(futas(dom, szoveg, rPrMinta(dom, mintaBekezdes)));
  return p;
}

// A válasz bekezdésekre bontva: üres sor választja el a bekezdéseket.
export function valaszBekezdesek(valasz) {
  return valasz
    .split(/\n\s*\n/)
    .map((b) => b.replace(/\s+$/gm, '').trim())
    .filter(Boolean);
}

function cellaKitolt(dom, tc, valasz, { hozzafuz = false } = {}) {
  const ps = gyerekek(tc, 'p');
  const minta = hozzafuz ? ps.at(-1) : ps[0];
  const ujak = valaszBekezdesek(valasz).map((b) => ujBekezdes(dom, minta, b));
  if (!ujak.length) return;
  if (!hozzafuz) for (const p of ps) tc.removeChild(p);
  for (const p of ujak) tc.appendChild(p);
}

function szovegElemek(p) {
  const eredmeny = [];
  const bejar = (n) => {
    for (let c = n.firstChild; c; c = c.nextSibling) {
      if (c.nodeType !== 1) continue;
      if (c.namespaceURI === W && c.localName === 't') eredmeny.push(c);
      else bejar(c);
    }
  };
  bejar(p);
  return eredmeny;
}

// Helykitöltő cseréje egy bekezdésben, akkor is, ha a Word több futásra vágta.
// Magyar névelő: „a” helyett „az”, ha a beírt szöveg magánhangzóval kezdődik.
function nevelotIgazit(ts, kezdet, ertek) {
  if (!/^[AÁEÉIÍOÓÖŐUÚÜŰaáeéiíoóöőuúüű]/.test(ertek)) return;
  let pozicio = 0;
  const teljes = ts.map((t) => t.textContent).join('');
  if (!/(^|\s)[Aa] $/.test(teljes.slice(0, kezdet))) return;
  const neveloHelye = kezdet - 2;
  for (const t of ts) {
    const hossz = t.textContent.length;
    if (neveloHelye >= pozicio && neveloHelye < pozicio + hossz) {
      const i = neveloHelye - pozicio;
      t.textContent = `${t.textContent.slice(0, i + 1)}z${t.textContent.slice(i + 1)}`;
      t.setAttributeNS(XML_NS, 'xml:space', 'preserve');
      return;
    }
    pozicio += hossz;
  }
}

function bekezdesbenCserel(dom, p, minta, ertek, nyelv) {
  let csere = 0;
  // A keresés a már beírt érték után folytatódik: ha a válasz maga is tartalmazza
  // a helykitöltőt, azt nem cseréli újra (különben végtelen ciklus lenne).
  let honnan = 0;
  for (;;) {
    const ts = szovegElemek(p);
    const reszek = ts.map((t) => t.textContent);
    const teljes = reszek.join('');
    let kezdet = teljes.indexOf(minta, honnan);
    if (kezdet < 0) return csere;
    if (nyelv === 'hu') {
      nevelotIgazit(ts, kezdet, ertek);
      reszek.splice(0, reszek.length, ...ts.map((t) => t.textContent));
      kezdet = reszek.join('').indexOf(minta, honnan);
    }
    honnan = kezdet + ertek.replace(/\n/g, '').length;
    const veg = kezdet + minta.length;
    let pozicio = 0;
    let elso = null;
    let utolso = null;
    const erintett = [];
    ts.forEach((t, i) => {
      const a = pozicio;
      const b = pozicio + reszek[i].length;
      pozicio = b;
      if (b <= kezdet || a >= veg || a === b) return;
      erintett.push({ t, a, b });
    });
    elso = erintett[0];
    utolso = erintett.at(-1);
    const elotte = elso.t.textContent.slice(0, kezdet - elso.a);
    const utana = utolso.t.textContent.slice(veg - utolso.a);
    for (const { t } of erintett) t.textContent = '';
    elso.t.textContent = elotte;
    elso.t.setAttributeNS(XML_NS, 'xml:space', 'preserve');
    const elsoFutas = elso.t.parentNode;
    const ujFutas = futas(dom, ertek, gyerekek(elsoFutas, 'rPr')[0] ?? null);
    elsoFutas.parentNode.insertBefore(ujFutas, elsoFutas.nextSibling);
    if (utana) {
      if (utolso === elso) {
        const maradek = futas(dom, utana, gyerekek(elsoFutas, 'rPr')[0] ?? null);
        const rPr = gyerekek(maradek, 'rPr')[0];
        const eredetiRpr = gyerekek(elsoFutas, 'rPr')[0];
        if (rPr && eredetiRpr) maradek.replaceChild(eredetiRpr.cloneNode(true), rPr);
        ujFutas.parentNode.insertBefore(maradek, ujFutas.nextSibling);
      } else {
        utolso.t.textContent = utana;
        utolso.t.setAttributeNS(XML_NS, 'xml:space', 'preserve');
      }
    }
    csere++;
  }
}

function mindenholCserel(dom, minta, ertek, nyelv) {
  return bekezdesek(dom).reduce((db, p) => db + bekezdesbenCserel(dom, p, minta, ertek, nyelv), 0);
}

function helykitoltoBekezdes(dom, minta) {
  return bekezdesek(dom).find((p) => normalizal(bekezdesSzoveg(p)).replace(/\n/g, ' ') === minta) ?? null;
}

function bekezdesCserel(dom, minta, valasz) {
  const p = helykitoltoBekezdes(dom, minta);
  if (!p) return;
  const ujak = valaszBekezdesek(valasz).map((b) => ujBekezdes(dom, p, b));
  if (!ujak.length) return;
  for (const u of ujak) p.parentNode.insertBefore(u, p);
  p.parentNode.removeChild(p);
}

const IGEN_SZAVAK = ['igen', 'yes'];
const NEM_SZAVAK = ['nem', 'no'];

export function igenNemBontas(valasz) {
  const [elso = '', ...tobbi] = valasz.trim().split('\n');
  const szo = elso.trim().replace(/[.:!]$/, '').toLowerCase();
  const dontes = IGEN_SZAVAK.includes(szo) ? 'igen' : NEM_SZAVAK.includes(szo) ? 'nem' : null;
  return { dontes, leiras: dontes ? tobbi.join('\n').trim() : valasz.trim() };
}

const TABLAZAT_ELVALASZTO = /^\|?\s*:?-{2,}/;

function sorokKitolt(dom, mezo, valasz) {
  const sorok0 = valasz.split('\n').map((s) => s.trim()).filter(Boolean);
  // Markdown-táblázatnál az elválasztó előtti sor a fejléc, nem személy.
  const elvalaszto = sorok0.findIndex((s) => TABLAZAT_ELVALASZTO.test(s));
  if (elvalaszto > 0) sorok0.splice(elvalaszto - 1, 1);
  const szemelyek = sorok0
    .filter((s) => !TABLAZAT_ELVALASZTO.test(s))
    .map((s) => s.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
  if (!szemelyek.length) return;
  const tbl = cella(dom, mezo.hely).parentNode.parentNode;
  let sorok = gyerekek(tbl, 'tr');
  while (sorok.length - mezo.hely.sor < szemelyek.length) {
    tbl.appendChild(sorok.at(-1).cloneNode(true));
    sorok = gyerekek(tbl, 'tr');
  }
  szemelyek.forEach((adatok, i) => {
    const cellak = gyerekek(sorok[mezo.hely.sor + i], 'tc');
    for (let o = 0; o < mezo.oszlopok; o++) cellaKitolt(dom, cellak[o], adatok[o] ?? '');
  });
}

export class UrlapEltérésHiba extends Error {}

// valaszok: { '7.2': { '1': '...' }, '7.4': {...}, '7.1': {...} }
export function kitolt(urlapBuffer, terkep, valaszok, { datum = new Date() } = {}) {
  if (ujjlenyomat(urlapBuffer, 'docx') !== terkep.ujjlenyomat) {
    throw new UrlapEltérésHiba(`A(z) ${terkep.dokumentum} űrlap nem az, amelyre a mezőtérkép készült; nem írok bele.`);
  }
  const doc = docxMegnyit(urlapBuffer);
  const { dom } = doc;
  const hibak = szerkezetEllenorzes(dom, terkep);
  if (hibak.length) throw new UrlapEltérésHiba(`A(z) ${terkep.dokumentum} űrlap szerkezete eltér: ${hibak.join('; ')}`);

  const ertek = (mezo) => {
    if (mezo.forras) {
      const [u, a] = mezo.forras.split('/');
      return valaszok[u]?.[a] ?? '';
    }
    if (mezo.alapertek) return alapertek(mezo.alapertek, datum, terkep.nyelv);
    return valaszok[terkep.urlap]?.[mezo.azonosito] ?? '';
  };

  for (const mezo of terkep.mezok) {
    const valasz = ertek(mezo);
    switch (mezo.tipus) {
      case 'bizottsagi':
      case 'utmutato':
        break;
      case 'cella':
        cellaKitolt(dom, cella(dom, mezo.hely), valasz);
        break;
      case 'cella-hozzafuzes':
        cellaKitolt(dom, cella(dom, mezo.hely), valasz, { hozzafuz: true });
        break;
      case 'igen-nem': {
        const { dontes, leiras } = igenNemBontas(valasz);
        if (dontes) {
          const tc = cella(dom, dontes === 'igen' ? mezo.igenHely : mezo.nemHely);
          for (const r of tc.getElementsByTagNameNS(W, 'r')) kiemel(dom, r);
        }
        cellaKitolt(dom, cella(dom, mezo.hely), leiras);
        break;
      }
      case 'helykitolto': {
        const v = valasz.replace(/\s*\n\s*/g, ' ').trim();
        if (v) mindenholCserel(dom, mezo.minta, v, terkep.nyelv);
        break;
      }
      case 'bekezdes':
        bekezdesCserel(dom, mezo.minta, valasz);
        break;
      case 'megerosites':
        if (igenNemBontas(valasz).dontes === 'igen') {
          const p = helykitoltoBekezdes(dom, mezo.minta);
          if (p) p.parentNode.removeChild(p);
        }
        break;
      case 'sorok':
        sorokKitolt(dom, mezo, valasz);
        break;
      default:
        throw new Error(`Ismeretlen mezőtípus: ${mezo.tipus}`);
    }
  }
  return docxMent(doc);
}
