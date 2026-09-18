#!/usr/bin/env node
import { main } from '../src/cli.js';
import '../src/parancsok.js';

main(process.argv.slice(2)).then(
  (code) => process.exit(code ?? 0),
  (err) => {
    console.error(`Hiba: ${err.message}`);
    process.exit(1);
  },
);
