import commander from 'commander';
import { Wrapper } from './wrapper';
import { Bar } from './bar';
import fs from 'fs';
import { Parser } from 'm3u8-parser';
import { catchError, concatMap, switchMap } from 'rxjs/operators';
import { of, Subject, throwError, zip } from 'rxjs';

const program = commander.program;
program
  .requiredOption('-t, --target <string>', 'm3u8 target url')
  .requiredOption('-o, --out-path <string>', 'output path');

program.parse(process.argv);

const pathExists = fs.existsSync(program.outPath);

if (!pathExists) {
  fs.mkdir(program.outPath, () => {
    console.log(program.outPath, 'created');
  });
}

const obj = new Subject<[number, string]>();
const wrapper = new Wrapper(program.target, program.outPath);
const bar = new Bar();

obj.pipe(concatMap((v) => zip(of(v[0]), wrapper.get(v[1])))).subscribe((x) => {
  bar.write(x[0] + 1);
});

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

    if (!parser.manifest || !parser.manifest.segments) {
      return;
    }

    if (parser.manifest.segments[0].key) {
      obj.next([0, parser.manifest.segments[0].key.uri]);
    }

    bar.setMaxValue(parser.manifest.segments.length);
    parser.manifest.segments.forEach((segment, index) => {
      let nextFileName = segment.uri.match(/(.*\.ts)(\??.*)/);
      if (nextFileName) {
        obj.next([index, nextFileName[1]]);
      }
    });
  });
