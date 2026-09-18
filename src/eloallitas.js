import { DOMImplementation } from '@xmldom/xmldom';
import { strToU8 } from 'fflate';
import { URLAPOK } from './mezoterkep.js';
import { kitolt } from './kitoltes.js';
import { fajlnev } from './fajlnev.js';
import { docxMent, W } from './docx.js';
import { frissitesEllenoriz } from './frissites.js';
import { beadIr, formaiEllenorzes, mellekletekEllenoriz } from './ellenorzes.js';
import { biralatIndit, biraloValaszt } from './biralat.js';
import { allapotIr, allapotOlvas, anyagBetolt, hash, ir, olvas, pillanatkep, wordLista, zarol } from './munkafolyamat.js';

function tajekoztatoWord(szoveg) {
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/u.test(szoveg)) throw new Error('A tájékoztató XML-ben nem megengedett vezérlőkaraktert tartalmaz.');
  const dom = new DOMImplementation().createDocument(W, 'w:document', null);
  const body = dom.createElementNS(W, 'w:body');
  dom.documentElement.appendChild(body);
  const sorok = szoveg === '' ? [''] : szoveg.split(/\r?\n/);
  for (const sor of sorok) {
    const p = dom.createElementNS(W, 'w:p');
    const r = dom.createElementNS(W, 'w:r');
    const t = dom.createElementNS(W, 'w:t');
    t.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
    t.appendChild(dom.createTextNode(sor));
    r.appendChild(t);
    p.appendChild(r);
    body.appendChild(p);
  }
  return docxMent({ dom, fajlok: {
    '[Content_Types].xml': strToU8('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'),
    '_rels/.rels': strToU8('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'),
  } });
}

async function frissit(root, options) {
  try { return await (options.frissitesEllenoriz ?? frissitesEllenoriz)(root, options.frissitesOptions ?? {}); } catch {
    return { allapot: 'nem-ellenorizheto', figyelmeztetesek: ['Nem sikerült ellenőrizni a kari dokumentumokat. A munka folytatható.'] };
  }
}

function futasKeszit(root, anyag, frissites, { tipus, generalt, mellekletek }) {
  const wordok = wordLista(root);
  const csatolando = [...generalt, ...(mellekletek ?? []).map((m) => m.fajl)];
  const fajlok = [...new Set([...csatolando, ...wordok])].sort();
  const snapshot = pillanatkep(root, fajlok);
  if (snapshot['keab/kerelem.md'] !== hash(anyag.bytes)) throw new Error('A munkaanyag a feldolgozás közben megváltozott; új előállítás szükséges.');
  const { draft, terkepBetolto, jegyzek } = anyag;
  const dokumentumok = jegyzek.dokumentumok.filter((d) => d.nyelv === draft.nyelv);
  const formai = formaiEllenorzes(root, { draft, terkepBetolto, frissites, mellekletek, generalt, wordok });
  return { tipus, idopont: new Date().toISOString(), nyelv: draft.nyelv, verzio: jegyzek.kutetikaVerzio, dokumentumok,
    generalt, csatolando, mellekletek, wordok, fajlok, pillanatkep: snapshot, token: hash(JSON.stringify(snapshot)),
    formai, frissites, felulbiralasok: [], biralat: { allapot: 'biralatra-var' } };
}

export async function eloallit(root, options = {}) {
  return zarol(root, async () => {
    biraloValaszt(options);
    const mellekletek = options.mellekletek;
    mellekletekEllenoriz(mellekletek);
    const frissites = await frissit(root, options);
    const anyag = anyagBetolt(root);
    const s = allapotOlvas(root);
    const datum = options.datum === undefined ? new Date() : new Date(options.datum);
    if (!Number.isFinite(datum.getTime())) throw new Error('Érvénytelen előállítási dátum.');
    const { draft, gyoker, terkepBetolto } = anyag;
    const nevek = Object.fromEntries([...URLAPOK, 'tajekoztato'].map((u) => [u, `keab/${fajlnev(u, draft.nyelv, draft.valaszok['7.2']?.['1'], datum)}`]));
    const generalt = Object.values(nevek);
    if ((mellekletek ?? []).some((m) => generalt.includes(m.fajl))) throw new Error('A melléklet neve ütközik egy előállítandó Word-fájllal.');
    const modositott = [];
    for (const f of generalt) {
      try {
        const bytes = olvas(root, f);
        if (s.serult || s.generalt[f] !== hash(bytes)) modositott.push(f);
      } catch (e) { if (e.code !== 'ENOENT') throw e; }
    }
    const felulirasToken = hash(JSON.stringify(pillanatkep(root, generalt)));
    if (modositott.length && options.felulirasMegerosites !== felulirasToken) return {
      mehet: false, allapot: 'feluliras-megerositest-ker', felulirasToken, modositott,
      figyelmeztetesek: [...frissites.figyelmeztetesek, 'A kézzel módosított vagy ismeretlen eredetű Word-fájlok felülíródnak. Előbb vigye át a javítást a kerelem.md-be, vagy a kutató kifejezett jóváhagyásával adja meg a felulirasMegerosites tokent.'],
    };
    const kimenetek = URLAPOK.map((u) => [nevek[u], kitolt(olvas(gyoker, `dokumentumok/${u}-${draft.nyelv}.docx`), terkepBetolto(u, draft.nyelv), draft.valaszok, { datum })]);
    kimenetek.push([nevek.tajekoztato, tajekoztatoWord(draft.tajekoztato)]);
    s.futas = null;
    s.serult = false;
    allapotIr(root, s);
    ir(root, 'keab/bead.md', '# Beadási tudnivalók\n\nElőállítás folyamatban; korábbi jóváhagyás nem érvényes.\n');
    for (const [f, bytes] of kimenetek) {
      ir(root, f, bytes);
      s.generalt[f] = hash(bytes);
      // Fájlonként mentve: ha egy későbbi írás elakad, a már megírtak nem tűnnek kézzel módosítottnak.
      allapotIr(root, s);
    }
    if (!s.engedelyek) s.engedelyek = {};
    irDontesek(root);
    s.futas = futasKeszit(root, anyag, frissites, { tipus: 'vegleges', generalt, mellekletek });
    allapotIr(root, s);
    beadIr(root, s);
    const eredmeny = await biralatIndit(root, s, options);
    beadIr(root, s);
    return { ...eredmeny, fajlok: generalt };
  });
}

function irDontesek(root) {
  try { olvas(root, 'keab/dontesek.md'); } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    ir(root, 'keab/dontesek.md', '# Kutatói döntések\n');
  }
}

export async function munkaanyagBiralat(root, options = {}) {
  return zarol(root, async () => {
    biraloValaszt(options);
    mellekletekEllenoriz(options.mellekletek);
    const frissites = await frissit(root, options);
    const anyag = anyagBetolt(root);
    const s = allapotOlvas(root);
    s.serult = false;
    s.futas = futasKeszit(root, anyag, frissites, { tipus: 'munkaanyag', generalt: [], mellekletek: options.mellekletek });
    allapotIr(root, s);
    ir(root, 'keab/bead.md', '# Ellenőrzés\n\nMunkaanyag-bírálat folyamatban; ez nem ad mehet állapotot. Új előállítás szükséges.\n');
    return biralatIndit(root, s, options);
  });
}
