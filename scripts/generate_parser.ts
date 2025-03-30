import fs from 'node:fs';
import peggy from 'peggy';
import tspegjs from 'ts-pegjs';

// load grammar
const grammar = fs.readFileSync('src/lib/grammar.tspegjs', 'utf8');

const parser = peggy.generate(grammar, {
  allowedStartRules: ['Program'],
  format: 'es',
  output: 'source',
  plugins: [tspegjs],
  tspegjs: {
    // customHeader: '/* eslint-disable unicorn/no-abusive-eslint-disable */'
    // customHeader: "// import lib\nimport { Lib } from 'mylib';"
  }
});

const headedParser =
  `/* eslint-disable unicorn/no-abusive-eslint-disable */\n` + parser;

// save to file
fs.writeFileSync('src/lib/parser.ts', headedParser);
