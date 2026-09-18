import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { KARI_DOKUMENTUMOK, linkekKeresese } from '../src/kar.js';

test('a mentett kari oldalon mind a nyolc dokumentum linkje megvan', () => {
  const linkek = linkekKeresese(readFileSync('test/fixtures/kar-oldal.html', 'utf8'));
  for (const dok of KARI_DOKUMENTUMOK) assert.ok(linkek[dok.azonosito], dok.azonosito);
  assert.match(linkek['7.2-hu'], /dstore\/document\/2231\//);
  assert.match(linkek['szabalyzat-en'], /Research_Ethics_Regulations/);
});

test('hiányzó link null', () => {
  const linkek = linkekKeresese('<a href="/semmi.pdf">x</a>');
  assert.equal(linkek['7.1-hu'], null);
});
