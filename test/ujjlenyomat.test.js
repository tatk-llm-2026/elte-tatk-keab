import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { docxMegnyit, docxMent, W } from '../src/docx.js';
import { normalizal, ujjlenyomat } from '../src/ujjlenyomat.js';

const eredeti = readFileSync('dokumentumok/7.2-hu.docx');

test('újramentett Word-dokumentum ujjlenyomata azonos', () => {
  const ujramentett = docxMent(docxMegnyit(eredeti));
  assert.notDeepEqual(ujramentett, eredeti);
  assert.equal(ujjlenyomat(ujramentett, 'docx'), ujjlenyomat(eredeti, 'docx'));
});

test('egy szó módosítása más ujjlenyomatot ad', () => {
  const doc = docxMegnyit(eredeti);
  const t = [...doc.dom.getElementsByTagNameNS(W, 't')].find((e) => e.textContent.includes('Tudományos fokozata'));
  t.textContent = t.textContent.replace('Tudományos', 'Akadémiai');
  assert.notEqual(ujjlenyomat(docxMent(doc), 'docx'), ujjlenyomat(eredeti, 'docx'));
});

test('a szóközök és a nem törhető szóköz nem számít', () => {
  assert.equal(normalizal('  alma  körte \n\n szilva '), 'alma körte\nszilva');
});

test('PDF-nél a fájl bájtjai számítanak', () => {
  const pdf = readFileSync('dokumentumok/szabalyzat-hu.pdf');
  assert.match(ujjlenyomat(pdf, 'pdf'), /^fajl-sha256:[0-9a-f]{64}$/);
});
