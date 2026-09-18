// A másik asszisztens (Codex vagy Claude Code) mint független bíráló, nem interaktív módban.
// Csak a bírálati csomag mappájában fut, írási jog nélkül, a projekt és a beszélgetés nélkül.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const IDOKORLAT = 20 * 60_000;

// Csak az induláshoz és a bejelentkezéshez szükséges környezeti változók öröklődnek.
const KORNYEZET = [
  'PATH', 'Path', 'PATHEXT', 'HOME', 'USER', 'LOGNAME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'SystemRoot', 'ComSpec',
  'TMPDIR', 'TMP', 'TEMP', 'LANG', 'LC_ALL', 'CODEX_HOME', 'CLAUDE_CONFIG_DIR', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY',
  'HTTPS_PROXY', 'HTTP_PROXY', 'NO_PROXY', 'https_proxy', 'http_proxy', 'no_proxy', 'SSL_CERT_FILE', 'NODE_EXTRA_CA_CERTS',
];

export function szukitettKornyezet(env = process.env) {
  return Object.fromEntries(KORNYEZET.filter((k) => env[k] !== undefined).map((k) => [k, env[k]]));
}

export function kulsoParancs(asszisztens, kimenet = null) {
  if (asszisztens === 'codex') {
    return {
      program: 'codex',
      argumentumok: ['exec', '--sandbox', 'read-only', '--ephemeral', '--skip-git-repo-check', '--ignore-user-config', '--ignore-rules', '--color', 'never',
        ...(kimenet ? ['--output-last-message', kimenet] : []), '-'],
      stdin: true,
    };
  }
  if (asszisztens === 'claude') {
    // --restricted: a fájleszközök a munkakönyvtárra (a csomag mappájára) korlátozódnak,
    // parancsfuttatás és webes lekérés nincs, a felhasználói és projektbeállítások kimaradnak.
    return {
      program: 'claude',
      argumentumok: ['-p', '--restricted', '--tools', 'Read,Glob,Grep', '--strict-mcp-config', '--no-session-persistence', '--output-format', 'json'],
      stdin: true,
    };
  }
  throw new Error('Nem támogatott külső bíráló.');
}

export function kulsoPrompt(keres) {
  return `${keres.utasitas}

You are running non-interactively in the review package folder (the current directory).
Read only the files in this folder: beadvany/ (the submission), kari/ (faculty forms and
regulation), biralo/SKILL.md (your instructions). Every .docx file has a plain-text copy
next to it (<name>.docx.txt, table rows and cells marked as [sor] and [cella]); read those.
Do not read anything outside this folder, and do not modify anything.

Answer with ONLY a JSON object, no prose, in this form:
{"kifogasok":[{"azonosito":"k1","sulyossag":"sulyos|javitando|figyelmeztetes","hely":"...","problema":"...","szabalyzat":null}]}
An empty list means no objections.`;
}

// Az első teljes JSON-objektum a szövegben (a modell néha kódblokkba teszi).
export function jsonKinyer(szoveg) {
  const blokk = /```(?:json)?\s*([\s\S]*?)```/.exec(szoveg);
  const jelolt = blokk ? blokk[1] : szoveg;
  const kezdet = jelolt.indexOf('{');
  const veg = jelolt.lastIndexOf('}');
  if (kezdet < 0 || veg < kezdet) throw new Error('A bíráló nem adott JSON-választ.');
  return JSON.parse(jelolt.slice(kezdet, veg + 1));
}

export function kimenetErtelmez(asszisztens, stdout, utolsoUzenet) {
  if (asszisztens === 'claude') {
    const valasz = JSON.parse(stdout);
    if (valasz.is_error || typeof valasz.result !== 'string') throw new Error('A Claude Code bírálata hibával állt le.');
    return jsonKinyer(valasz.result);
  }
  return jsonKinyer(utolsoUzenet ?? stdout);
}

function idezo(arg) {
  return /^[\w.,:/\\=-]+$/.test(arg) ? arg : `"${arg.replace(/"/g, '""')}"`;
}

export function futtat({ program, argumentumok, cwd, bemenet, env, idokorlat = IDOKORLAT, platform = process.platform, inditas = spawn }) {
  return new Promise((resolve, reject) => {
    // Windowson az npm .cmd indítófájlt telepít, ezt csak parancsértelmezőn át lehet indítani.
    const win = platform === 'win32';
    const gyerek = win
      ? inditas([program, ...argumentumok].map(idezo).join(' '), { cwd, env, shell: true, windowsHide: true })
      : inditas(program, argumentumok, { cwd, env });
    let stdout = '';
    let stderr = '';
    const ora = setTimeout(() => { gyerek.kill(); reject(new Error('A bíráló nem végzett az időkorláton belül.')); }, idokorlat);
    gyerek.stdout.on('data', (d) => { stdout += d; });
    gyerek.stderr.on('data', (d) => { stderr += d; });
    gyerek.on('error', (e) => { clearTimeout(ora); reject(e); });
    gyerek.on('close', (kod) => {
      clearTimeout(ora);
      if (kod === 0) resolve(stdout);
      else reject(new Error(`A bíráló hibával állt le (${kod}): ${stderr.trim().split('\n').at(-1) ?? ''}`));
    });
    gyerek.stdin.end(bemenet);
  });
}

// Az elkülönített futtató: a bírálat eredményéhez a program maga teszi hozzá az azonosítókat,
// a modelltől csak a kifogáslistát fogadja el.
export async function kulsoFuttat(keres, { futtato = futtat, env = process.env } = {}) {
  const ideiglenes = mkdtempSync(join(tmpdir(), 'kutetika-kimenet-'));
  try {
    const kimenet = join(ideiglenes, 'utolso-uzenet.txt');
    const parancs = kulsoParancs(keres.asszisztens, keres.asszisztens === 'codex' ? kimenet : null);
    const stdout = await futtato({ program: parancs.program, argumentumok: parancs.argumentumok, cwd: keres.mappa, bemenet: kulsoPrompt(keres), env: szukitettKornyezet(env) });
    let utolso = null;
    try { utolso = readFileSync(kimenet, 'utf8'); } catch {}
    const { kifogasok } = kimenetErtelmez(keres.asszisztens, stdout, utolso);
    return { token: keres.token, keres: keres.azonosito, asszisztens: keres.asszisztens, mod: keres.mod, kifogasok };
  } finally {
    rmSync(ideiglenes, { recursive: true, force: true });
  }
}
