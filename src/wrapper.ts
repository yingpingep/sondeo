import { concat, Observable, Subject, throwError } from 'rxjs';
import { Agent } from 'https';
import {
  Data,
  Downloader,
  Injector,
  Parser,
  Status,
  Writer,
} from './interfaces/interfaces';
import { concatMap, switchMap } from 'rxjs/operators';

export class Wrapper {
  private readonly outPath: string;
  private readonly agent: Agent;
  private data: Data;
  private parser: Parser;
  private downloader: Downloader;
  private writer: Writer;

  constructor(outPath: string, injector: Injector) {
    this.outPath = outPath;
    this.agent = new Agent({ keepAlive: true });

    this.data = new Data();
    this.parser = injector.get('Parser');
    this.downloader = injector.get('Downloader');
    this.writer = injector.get('Writer');
  }

  save(target: string): Observable<Status> {
    const notify = new Subject<Status>();

    const url = new URL(target);
    this.downloader.url = url;
    const fileName = url.pathname.split('/').slice(-1)[0];
    this.downloader
      .download(fileName)
      .pipe(
        switchMap((result) => {
          const manifest = this.parser.parse(Buffer.from(result.data.buffer));

          const fileName = result.name.match(/(.*(\.ts|\.m3u8))(\??.*)/)?.[0];
          const filePath = this.outPath + '/' + fileName;

          this.writer.writeFile(filePath, result.data);

          if (!manifest.segments || manifest.segments.length === 0) {
            return throwError('error');
          }

          for (const segment of manifest.segments) {
            this.data.parts.set(segment.uri, false);
          }
          const key = manifest.segments[0].key;
          this.data.parts.set(key.uri, false);

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
        }),
        concatMap((result) => {
          const fileName =
            result.name.match(/(.*(\.ts|\.m3u8))(\??.*)/)?.[0] || '';
          const filePath = this.outPath + '/' + fileName;
          this.data.parts.set(fileName, true);
          const status: Status = {
            total: this.data.parts.size,
            downloaded: Array.from(this.data.parts.values()).filter((d) => d)
              .length,
          };
          notify.next(status);
          return this.writer.writeFile(filePath, result.data);
        })
      )
      .subscribe();

    return notify.asObservable();
  }
}
