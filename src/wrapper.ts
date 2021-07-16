import { concat, forkJoin, merge, Observable, Subject, throwError } from 'rxjs';
import { Agent } from 'https';
import {
  Data,
  Downloader,
  Injector,
  Parser,
  Result,
  Status,
  Writer,
} from './interfaces/interfaces';
import { concatMap, delayWhen, map, switchMap, tap } from 'rxjs/operators';

export class Wrapper {
  private readonly outPath: string;
  private readonly agent: Agent;
  private data: Data;
  private parser: Parser;
  private downloader: Downloader;
  private writer: Writer;
  private downloaded$: Subject<Result>;
  private trigger$: Subject<void>;

  constructor(outPath: string, injector: Injector) {
    this.outPath = outPath;
    this.agent = new Agent({ keepAlive: true });

    this.data = new Data();
    this.parser = injector.get('Parser');
    this.downloader = injector.get('Downloader');
    this.writer = injector.get('Writer');

    this.downloaded$ = new Subject<Result>();
    this.trigger$ = new Subject<void>();
  }

  save(target: string): Observable<Status> {
    const notify = new Subject<Status>();
    this.downloaded$
      .pipe(concatMap((result) => this.saveFile(result)))
      .subscribe((fileName) => {
        this.data.parts.set(fileName, true);
        const status: Status = {
          total: this.data.parts.size,
          downloaded: Array.from(this.data.parts.values()).filter((d) => d)
            .length,
        };
        notify.next(status);
      });

    const url = new URL(target);
    this.downloader.url = url;
    const fileName = url.pathname.split('/').slice(-1)[0];
    this.downloader
      .download(fileName)
      .pipe(
        switchMap((result) => {
          const manifest = this.parser.parse(Buffer.from(result.data.buffer));
          this.downloaded$.next(result);
          this.trigger$.next();

          if (!manifest.segments || manifest.segments.length === 0) {
            return throwError('error');
          }

          const key = manifest.segments[0].key;
          if (key) {
            this.data.parts.set(key.uri, false);
          }
          for (const segment of manifest.segments) {
            this.data.parts.set(segment.uri, false);
          }

          const status: Status = {
            total: this.data.parts.size,
            downloaded: Array.from(this.data.parts.values()).filter((d) => d)
              .length,
          };
          notify.next(status);
          return concat(
            ...Array.from(this.data.parts.keys()).map((part) =>
              this.downloader.download(part)
            )
          );
        })
      )
      .subscribe((result) => {
        this.downloaded$.next(result);
      });

    return notify.asObservable();
  }

  private saveFile(result: Result): Observable<string> {
    const fileName = result.name.match(/(.*(\.ts|\.m3u8))(\??.*)/)?.[0] || '';
    const filePath = this.outPath + '/' + fileName;
    return this.writer
      .writeFile(filePath, result.data)
      .pipe(map(() => fileName));
  }
}
