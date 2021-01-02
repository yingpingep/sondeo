import commander from 'commander';
import { Wrapper } from './wrapper';
import fs from 'fs';
import { Parser } from 'm3u8-parser';
import { catchError, concatMap, switchMap } from 'rxjs/operators';
import { of, Subject, throwError } from 'rxjs';

const program = commander.program;
program
  .requiredOption('-t, --target <string>', 'm3u8 target url')
  .requiredOption('-o, --out-path <string>', 'output path');

program.parse(process.argv);

const obj = new Subject<string>();
const wrapper = new Wrapper(program.target, program.outPath);
obj
  .pipe(concatMap((name) => wrapper.get(name)))
  .subscribe((filename) => console.log('⚡', filename, 'done'));

wrapper
  .getIndex()
  .pipe(
    switchMap((result) => {
      const outputFilename = result.location.match(/(.*\.m3u8)(\??.*)/);
      if (!outputFilename) {
        return throwError('index is not found');
      }
      return result.isLocalFile
        ? of(result.location)
        : wrapper.get(result.location, outputFilename[1]);
    }),
    catchError((e) => {
      console.log(`⚡⚡ => ${e}`);
      return of(null);
    })
  )
  .subscribe((file) => {
    if (!file) {
      return;
    }

    const content = fs.readFileSync(file);

    const parser = new Parser();
    parser.push(content.toString());
    parser.end();

    parser.manifest.segments.forEach((segment) => {
      let nextFileName = segment.uri.match(/(.*\.ts)(\??.*)/);
      if (nextFileName) {
        obj.next(nextFileName[1]);
      }
    });
  });
