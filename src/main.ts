import commander from 'commander';
import { Wrapper } from './wrapper';
import fs from 'fs';
import { Parser } from 'm3u8-parser';
import {
  catchError,
  concatAll,
  concatMap,
  exhaustMap,
  observeOn,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';
import {
  concat,
  merge,
  Observable,
  of,
  queueScheduler,
  scheduled,
  Subject,
  Subscriber,
  throwError,
} from 'rxjs';

const program = commander.program;
program
  .requiredOption('-t, --target <string>', 'm3u8 target url')
  .requiredOption('-o, --out-path <string>', 'output path');

program.parse(process.argv);

const obj = new Subject<string>();
const wrapper = new Wrapper(program.target, program.outPath);
obj
  .pipe(concatMap((name) => wrapper.get(name)))
  .subscribe((v) => console.log('⚡', v));

wrapper
  .getIndex()
  .pipe(
    switchMap((index) => {
      const c = index.match(/(.*\.m3u8)(\?.*)/);
      if (c) {
        return wrapper.get(index, c[1]);
      }
      return throwError('index is not found');
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
      let x = segment.uri.match(/(.*\.ts)(\?.*)/);
      if (x) {
        obj.next(x[1]);
      }
    });
  });
