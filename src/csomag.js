import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CSOMAG_GYOKER = join(dirname(fileURLToPath(import.meta.url)), '..');

export function csomagJson() {
  return JSON.parse(readFileSync(join(CSOMAG_GYOKER, 'package.json'), 'utf8'));
}

export function verzio() {
  return csomagJson().version;
}
