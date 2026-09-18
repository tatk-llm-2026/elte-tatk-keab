// A kar oldala és a csomagban tartott kari dokumentumok leírása.

export const KAR_OLDAL = 'https://tatk.elte.hu/bizottsagok/kutetika';

// Minden dokumentumot a letöltési linkjének (dekódolt) fájlneve alapján
// azonosítunk. Ha a kar átnevezi a fájlt, a link nem található, és ezt
// a frissítésfigyelés jelzi.
export const KARI_DOKUMENTUMOK = [
  { azonosito: '7.1-hu', nyelv: 'hu', tipus: 'docx', fajl: '7.1-hu.docx', minta: /\/7\.1 Kutatásintegritási nyilatkozat[^/]*\.docx$/ },
  { azonosito: '7.2-hu', nyelv: 'hu', tipus: 'docx', fajl: '7.2-hu.docx', minta: /\/7\.2 Kutatásintegritási űrlap[^/]*\.docx$/ },
  { azonosito: '7.4-hu', nyelv: 'hu', tipus: 'docx', fajl: '7.4-hu.docx', minta: /\/7\.4 Adatkezelési terv[^/]*\.docx$/ },
  { azonosito: '7.1-en', nyelv: 'en', tipus: 'docx', fajl: '7.1-en.docx', minta: /\/7\.1 Statement of research integrity[^/]*\.docx$/ },
  { azonosito: '7.2-en', nyelv: 'en', tipus: 'docx', fajl: '7.2-en.docx', minta: /\/7\.2 Research integrity application form[^/]*\.docx$/ },
  { azonosito: '7.4-en', nyelv: 'en', tipus: 'docx', fajl: '7.4-en.docx', minta: /\/7\.4 Plan for data processing[^/]*\.docx$/ },
  { azonosito: 'szabalyzat-hu', nyelv: 'hu', tipus: 'pdf', fajl: 'szabalyzat-hu.pdf', minta: /\/Kutatasetikai_Szabalyzat_ELTE_TaTK\.pdf$/ },
  { azonosito: 'szabalyzat-en', nyelv: 'en', tipus: 'pdf', fajl: 'szabalyzat-en.pdf', minta: /\/Research_Ethics_Regulations_ELTE_TaTK\.pdf$/ },
];

export function linkekKeresese(html, alapCim = KAR_OLDAL) {
  const hrefek = [...html.matchAll(/href="([^"]+)"/g)].map((t) => {
    const cim = new URL(t[1].replaceAll('&amp;', '&'), alapCim).href;
    let dekodolt;
    try {
      dekodolt = decodeURIComponent(new URL(cim).pathname);
    } catch {
      dekodolt = new URL(cim).pathname;
    }
    return { cim, dekodolt };
  });
  const talalatok = {};
  for (const dok of KARI_DOKUMENTUMOK) {
    const talalat = hrefek.find((h) => dok.minta.test(h.dekodolt));
    talalatok[dok.azonosito] = talalat ? talalat.cim : null;
  }
  return talalatok;
}

export async function letolt(cim) {
  const valasz = await fetch(cim, { signal: AbortSignal.timeout(30_000) });
  if (!valasz.ok) throw new Error(`${cim}: HTTP ${valasz.status}`);
  return Buffer.from(await valasz.arrayBuffer());
}
