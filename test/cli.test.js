import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const futtat = (...args) => execFileSync('node', ['bin/kutetika.js', ...args], { encoding: 'utf8' });

test('--help kiírja a súgót', () => {
  assert.match(futtat('--help'), /kutetika init/);
});

test('--version a package.json verzióját adja', () => {
  assert.match(futtat('--version'), /^\d+\.\d+\.\d+\n$/);
});

test('vaz: üres munkaanyag a beadvány nyelvén, meglévőt nem ír felül', async () => {
  const { mkdtempSync, readFileSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { execFileSync } = await import('node:child_process');
  const cel = mkdtempSync(join(tmpdir(), 'kutetika-vaz-'));
  const fut = (json) => JSON.parse(execFileSync('node', ['bin/kutetika.js', 'vaz', cel, json], { encoding: 'utf8' }));
  assert.equal(fut('{"nyelv":"en"}').allapot, 'letrehozva');
  assert.match(readFileSync(join(cel, 'keab/kerelem.md'), 'utf8'), /^<!-- kutetika-kerelem nyelv=en -->/);
  writeFileSync(join(cel, 'keab/kerelem.md'), 'saját munka');
  assert.equal(fut('{"nyelv":"hu"}').allapot, 'mar-letezik');
  assert.equal(readFileSync(join(cel, 'keab/kerelem.md'), 'utf8'), 'saját munka');
});

test('a JSON-beállítás fájlból is átadható (@fájl, BOM-mal is)', async () => {
  const { mkdtempSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const cel = mkdtempSync(join(tmpdir(), 'kutetika-json-'));
  writeFileSync(join(cel, 'b.json'), '﻿{"nyelv":"hu"}');
  assert.equal(JSON.parse(futtat('vaz', cel, `@${join(cel, 'b.json')}`)).allapot, 'letrehozva');
});
