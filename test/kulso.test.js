import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { futtat, jsonKinyer, kimenetErtelmez, kulsoFuttat, kulsoParancs, szukitettKornyezet } from '../src/kulso.js';

const keres = { asszisztens: 'codex', mod: 'kulso', token: 't'.repeat(64), azonosito: 'k-1', mappa: '/csomag', utasitas: 'Bírálj.' };
const kifogas = { azonosito: 'x', sulyossag: 'javitando', hely: '7.2/[1]', problema: 'rövid', szabalyzat: null };

test('JSON kinyerése kódblokkból és körítő szövegből', () => {
  assert.deepEqual(jsonKinyer('```json\n{"kifogasok":[]}\n```'), { kifogasok: [] });
  assert.deepEqual(jsonKinyer('Itt az eredmény: {"kifogasok":[{"a":1}]} kész.'), { kifogasok: [{ a: 1 }] });
  assert.throws(() => jsonKinyer('nincs benne'), /JSON/);
});

test('Claude Code kimenete: a result mezőből; hibás futás nem fogadható el', () => {
  assert.deepEqual(kimenetErtelmez('claude', JSON.stringify({ result: '{"kifogasok":[]}' })), { kifogasok: [] });
  assert.throws(() => kimenetErtelmez('claude', JSON.stringify({ is_error: true, result: 'x' })));
  assert.deepEqual(kimenetErtelmez('codex', 'zaj', '{"kifogasok":[]}'), { kifogasok: [] });
});

test('parancsok: Codex írás nélkül, felhasználói beállítások nélkül; Claude korlátozott módban', () => {
  const codex = kulsoParancs('codex', '/tmp/ki.txt').argumentumok;
  for (const a of ['read-only', '--ephemeral', '--ignore-user-config', '--ignore-rules', '/tmp/ki.txt']) assert.ok(codex.includes(a), a);
  const claude = kulsoParancs('claude').argumentumok;
  for (const a of ['--restricted', '--strict-mcp-config', '--no-session-persistence']) assert.ok(claude.includes(a), a);
  assert.ok(!claude.some((a) => /Bash|Write|Edit/.test(a)));
});

test('csak a szükséges környezeti változók öröklődnek', () => {
  const env = szukitettKornyezet({ PATH: '/bin', HOME: '/h', OPENAI_API_KEY: 'k', TITKOS_TOKEN: 's', GITHUB_TOKEN: 'g' });
  assert.deepEqual(env, { PATH: '/bin', HOME: '/h', OPENAI_API_KEY: 'k' });
});

test('az azonosítókat a program adja, a modelltől csak a kifogásokat fogadja el; a csomag mappájában fut', async () => {
  let hivas;
  const futtato = async (p) => { hivas = p; return JSON.stringify({ token: 'hamis', keres: 'hamis', kifogasok: [kifogas] }); };
  const e = await kulsoFuttat(keres, { futtato, env: { PATH: '/bin', TITKOS: 'x' } });
  assert.deepEqual(e, { token: keres.token, keres: 'k-1', asszisztens: 'codex', mod: 'kulso', kifogasok: [kifogas] });
  assert.equal(hivas.cwd, '/csomag');
  assert.equal(hivas.program, 'codex');
  assert.deepEqual(hivas.env, { PATH: '/bin' });
  assert.match(hivas.bemenet, /^Bírálj\./);
  assert.match(hivas.bemenet, /Read only the files in this folder/);
});

function hamisInditas(kod, kimenet, naplo) {
  return (...args) => {
    naplo.push(args);
    const gyerek = new EventEmitter();
    gyerek.stdout = new PassThrough();
    gyerek.stderr = new PassThrough();
    gyerek.stdin = new PassThrough();
    gyerek.kill = () => {};
    setImmediate(() => { gyerek.stdout.end(kimenet); gyerek.stderr.end('hiba: nincs bejelentkezve\n'); setImmediate(() => gyerek.emit('close', kod)); });
    return gyerek;
  };
}

test('futtatás: Windowson parancsértelmezőn át, idézett útvonallal; hibakód esetén az ok látszik', async () => {
  const naplo = [];
  const ki = await futtat({ program: 'codex', argumentumok: ['exec', '-o', 'C:\\Users\\Kiss Anna\\ki.txt'], cwd: 'C:\\x', bemenet: 'b', env: {}, platform: 'win32', inditas: hamisInditas(0, 'ok', naplo) });
  assert.equal(ki, 'ok');
  assert.equal(naplo[0][0], 'codex exec -o "C:\\Users\\Kiss Anna\\ki.txt"');
  assert.equal(naplo[0][1].shell, true);
  await assert.rejects(futtat({ program: 'codex', argumentumok: [], cwd: '/', bemenet: '', env: {}, platform: 'darwin', inditas: hamisInditas(1, '', []) }), /nincs bejelentkezve/);
});
