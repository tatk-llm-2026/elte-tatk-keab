import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { agentsFrissit, claudeBlokk, BLOKK_KEZDET, BLOKK_VEG, CLAUDE_KEZDET, CLAUDE_VEG, SKILL_HELYEK, telepit } from '../src/telepites.js';

const ujProjekt = () => mkdtempSync(join(tmpdir(), 'kutetika-'));
const init = (cel) => execFileSync('node', ['bin/kutetika.js', 'init', cel], { encoding: 'utf8' });

test('üres projekt: skillek, program, dokumentumok, AGENTS.md', () => {
  const cel = ujProjekt();
  const kimenet = init(cel);
  for (const hely of SKILL_HELYEK) {
    for (const skill of ['kutetika-engedely', 'kutetika-kerelem', 'kutetika-biralat']) {
      assert.ok(existsSync(join(cel, hely, skill, 'SKILL.md')), `${hely}/${skill}`);
    }
  }
  for (const f of ['bin/kutetika.js', 'dokumentumok/7.2-hu.docx', 'dokumentumok/szabalyzat-en.md', 'mezoterkepek/7.4-en.json', 'node_modules/fflate/package.json']) {
    assert.ok(existsSync(join(cel, '.kutetika', f)), f);
  }
  const agents = readFileSync(join(cel, 'AGENTS.md'), 'utf8');
  assert.ok(agents.startsWith(BLOKK_KEZDET));
  assert.match(agents, /Do not read raw research data by default/);
  const claude = readFileSync(join(cel, 'CLAUDE.md'), 'utf8');
  assert.ok(claude.startsWith(CLAUDE_KEZDET));
  assert.match(claude, /@AGENTS\.md/);
  assert.match(kimenet, /kell nekem etikai engedély\?/);
  assert.ok(!existsSync(join(cel, 'keab')), 'az init nem hoz létre keab mappát');
});

test('a projektbe másolt program önállóan fut, és eléri a mezőtérképeket', () => {
  const cel = ujProjekt();
  init(cel);
  const verzio = execFileSync('node', [join(cel, '.kutetika/bin/kutetika.js'), '--version'], { encoding: 'utf8', cwd: tmpdir() });
  assert.match(verzio, /^\d+\.\d+\.\d+/);
  const modul = pathToFileURL(join(cel, '.kutetika/src/kerelem.js')).href;
  const kod = `import(${JSON.stringify(modul)}).then((k) => console.log(k.vazKeszit('hu').length))`;
  assert.ok(Number(execFileSync('node', ['-e', kod], { encoding: 'utf8', cwd: tmpdir() })) > 1000);
});

test('meglévő fájlok: a saját tartalom változatlan, a blokk a végére kerül', () => {
  const cel = ujProjekt();
  mkdirSync(join(cel, 'data'));
  writeFileSync(join(cel, 'data', 'adat.csv'), 'id,valasz\n1,igen\n');
  writeFileSync(join(cel, 'AGENTS.md'), '# Saját szabályok\n\nNe törölj semmit.\n');
  mkdirSync(join(cel, '.claude', 'skills', 'sajat-skill'), { recursive: true });
  writeFileSync(join(cel, '.claude', 'skills', 'sajat-skill', 'SKILL.md'), 'saját');
  init(cel);
  assert.equal(readFileSync(join(cel, 'data', 'adat.csv'), 'utf8'), 'id,valasz\n1,igen\n');
  assert.equal(readFileSync(join(cel, '.claude', 'skills', 'sajat-skill', 'SKILL.md'), 'utf8'), 'saját');
  const agents = readFileSync(join(cel, 'AGENTS.md'), 'utf8');
  assert.ok(agents.startsWith('# Saját szabályok\n\nNe törölj semmit.\n\n'));
  assert.ok(agents.trimEnd().endsWith(BLOKK_VEG));
});

test('újratelepítés: a blokk nem duplázódik, a keab mappa érintetlen, a csomag fájljai frissülnek', () => {
  const cel = ujProjekt();
  writeFileSync(join(cel, 'AGENTS.md'), '# Saját\n');
  init(cel);
  mkdirSync(join(cel, 'keab'));
  writeFileSync(join(cel, 'keab', 'kerelem.md'), 'munka');
  writeFileSync(join(cel, '.kutetika', 'dokumentumok', 'regi-fajl.txt'), 'régi');
  writeFileSync(join(cel, '.claude', 'skills', 'kutetika-kerelem', 'SKILL.md'), 'elavult');
  const agents = readFileSync(join(cel, 'AGENTS.md'), 'utf8').replace('Do not read raw research data by default', 'ELAVULT');
  writeFileSync(join(cel, 'AGENTS.md'), `${agents}\nUtána írt saját sor.\n`);
  init(cel);
  const uj = readFileSync(join(cel, 'AGENTS.md'), 'utf8');
  assert.equal(uj.split(BLOKK_KEZDET).length, 2);
  assert.doesNotMatch(uj, /ELAVULT/);
  assert.match(uj, /Utána írt saját sor\./);
  assert.ok(uj.startsWith('# Saját\n'));
  assert.equal(readFileSync(join(cel, 'keab', 'kerelem.md'), 'utf8'), 'munka');
  assert.ok(!existsSync(join(cel, '.kutetika', 'dokumentumok', 'regi-fajl.txt')));
  assert.notEqual(readFileSync(join(cel, '.claude', 'skills', 'kutetika-kerelem', 'SKILL.md'), 'utf8'), 'elavult');
});

for (const sorveg of ['\n', '\r\n']) {
  test(`CLAUDE.md: saját tartalom megőrzése és ismételt telepítés (${JSON.stringify(sorveg)})`, () => {
    const cel = ujProjekt();
    const sajat = `# Saját utasítások${sorveg}${sorveg}Ne törölj semmit.  ${sorveg}${sorveg}`;
    writeFileSync(join(cel, 'CLAUDE.md'), sajat);
    init(cel);
    const elso = readFileSync(join(cel, 'CLAUDE.md'), 'utf8');
    assert.ok(elso.startsWith(sajat));
    assert.equal(elso.split('@AGENTS.md').length, 2);
    const utana = `${sorveg}Utána írt saját sor.  ${sorveg}`;
    writeFileSync(join(cel, 'CLAUDE.md'), elso.replace('@AGENTS.md', 'ELAVULT') + utana);
    init(cel);
    const masodik = readFileSync(join(cel, 'CLAUDE.md'), 'utf8');
    assert.equal(masodik, elso + utana);
    assert.equal(masodik.split(CLAUDE_KEZDET).length, 2);
    assert.equal(masodik.split(CLAUDE_VEG).length, 2);
    if (sorveg === '\r\n') assert.doesNotMatch(masodik, /(?<!\r)\n/);
  });
}

test('jelölt blokk hozzáfűzése nem töröl szóközt vagy sorvéget', () => {
  for (const sajat of ['csak szöveg  ', ' \n\n', '\r\n  \r\n']) {
    const uj = agentsFrissit(sajat, claudeBlokk(), { kezdetJelolo: CLAUDE_KEZDET, vegJelolo: CLAUDE_VEG });
    assert.ok(uj.startsWith(sajat));
    assert.equal(agentsFrissit(uj, claudeBlokk(), { kezdetJelolo: CLAUDE_KEZDET, vegJelolo: CLAUDE_VEG }), uj);
  }
});

test('telepit visszaadja a skilleket', () => {
  assert.deepEqual(telepit(ujProjekt()).skillek.sort(), ['kutetika-biralat', 'kutetika-engedely', 'kutetika-kerelem']);
});

test('a CLAUDE.md ugyanaz a fájl, mint az AGENTS.md: a szabályok megmaradnak', () => {
  const cel = ujProjekt();
  writeFileSync(join(cel, 'AGENTS.md'), '# Szabályaim\n');
  symlinkSync('AGENTS.md', join(cel, 'CLAUDE.md'));
  init(cel);
  init(cel);
  const agents = readFileSync(join(cel, 'AGENTS.md'), 'utf8');
  assert.match(agents, /Research data protection/);
  assert.equal(agents.split(BLOKK_KEZDET).length, 2);
  assert.doesNotMatch(agents, /@AGENTS\.md/);
});

test('a szövegben idézett jelölő nem számít blokknak', () => {
  const sajat = `Leírás: a blokk vége ez: \`${BLOKK_VEG}\`, a kezdete ${BLOKK_KEZDET} jelölő.\n`;
  let szoveg = sajat;
  for (let i = 0; i < 3; i++) szoveg = agentsFrissit(szoveg, `${BLOKK_KEZDET}\nx\n${BLOKK_VEG}`);
  assert.ok(szoveg.startsWith(sajat));
  assert.equal(szoveg.split(`\n${BLOKK_KEZDET}\n`).length, 2);
});

test('árva vagy dupla jelölőnél a telepítés megáll, és egyik fájl sem változik', () => {
  for (const hibas of [`# Saját\n${BLOKK_KEZDET}\nkézi szöveg\n`, `${BLOKK_VEG}\nx\n`, `${BLOKK_KEZDET}\na\n${BLOKK_VEG}\n${BLOKK_KEZDET}\nb\n${BLOKK_VEG}\n`]) {
    const cel = ujProjekt();
    writeFileSync(join(cel, 'AGENTS.md'), hibas);
    assert.throws(() => init(cel), /jelölői/);
    assert.equal(readFileSync(join(cel, 'AGENTS.md'), 'utf8'), hibas);
    assert.ok(!existsSync(join(cel, 'CLAUDE.md')));
  }
});

test('init: kapcsoló, nem létező mappa és a saját mappa elutasítva', async () => {
  const { initCel } = await import('../src/parancsok.js');
  const cel = ujProjekt();
  assert.throws(() => initCel(['--help']), /Használat/);
  assert.throws(() => initCel([join(cel, 'nincs')]), /Nincs ilyen mappa/);
  assert.throws(() => initCel([cel], { otthon: cel }), /projektmappájába/);
  assert.equal(initCel([cel]), cel);
  assert.ok(!existsSync(join(cel, 'nincs')));
});
