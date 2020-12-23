import commander from 'commander';
import { Wrapper } from './wrapper';
import fs from 'fs';
import { Parser } from 'm3u8-parser';

const program = commander.program;
program
  .requiredOption('-t, --target <string>', 'm3u8 target url')
  .requiredOption('-o, --out-path <string>', 'output path');

program.parse(process.argv);

console.log(`⚡ => ${program.target}`);
console.log(`⚡ => ${program.outPath}`);
// const wrapper = new Wrapper(program.target, program.outPath);
fs.readFile('./test/master.m3u8', (err, data) => {
  const parser = new Parser();
  parser.push(data.toString());
  parser.end();
  parser.manifest.playlists.forEach((v) => console.log(v));
});
