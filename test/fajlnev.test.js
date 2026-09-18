import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fajlnev, vezeteknev } from '../src/fajlnev.js';

const DATUM = new Date(2026, 8, 17);

test('ékezetes vezetéknév, címmel', () => {
  assert.equal(fajlnev('7.2', 'hu', 'Dr. Őrsi-Kovács Éva', DATUM), '7.2 Kutatásintegritási űrlap (ORSI-KOVACS_20260917).docx');
});

test('angol beadvány: a vezetéknév a név végén', () => {
  assert.equal(fajlnev('7.4', 'en', 'Prof. Anna Smith PhD', DATUM), '7.4 Plan for data processing (SMITH_20260917).docx');
});

test('hiányzó név esetén jelölő szöveg', () => {
  assert.equal(fajlnev('7.1', 'hu', '', DATUM), '7.1 Kutatásintegritási nyilatkozat (KUTATASVEZETO_20260917).docx');
});

test('vezetéknév', () => {
  assert.equal(vezeteknev('dr. habil. Nagy Péter', 'hu'), 'Nagy');
});
