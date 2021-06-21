import { Data, Downloader, Writer } from './interfaces/interfaces';
import https, { Agent, RequestOptions } from 'https';
import { concat, Observable, Subject } from 'rxjs';

export class DownloaderImpl implements Downloader {
  url: URL | undefined;
  private agent = new Agent({ keepAlive: true });

  constructor(private writer: Writer) {}

  download(data: Data, path: string): Observable<string> {
    const notify = new Subject<string>();
    const observable = notify.asObservable();
    if (!data.parts) {
      notify.complete();
      return observable;
    }

    concat(...data.parts.map((part) => this.getSingle(part, path))).subscribe({
      next: notify.next,
      complete: notify.complete,
    });

    return observable;
  }

  private getSingle(target: string, outputPath: string): Observable<string> {
    const notify = new Subject<string>();
    if (!this.url) {
      notify.error('');
      return notify.asObservable();
    }

    const host = this.url.host;
    const pathList = [...this.url.pathname.split('/').filter((e) => e), target];
    const path = pathList.join('/') + this.url.search;
    const option: RequestOptions = {
      host,
      path,
      agent: this.agent,
    };

    const fileName = target.match(/(.*\.ts)(\??.*)/);
    const req = https.get(option);

    req
      .on('response', (res) => {
        const data: Buffer[] = [];
        res
          .on('data', (chunk: Buffer) => {
            data.push(chunk);
          })
          .on('end', () => {
            const filePath = outputPath + '/' + fileName;
            const dv = new DataView(Buffer.concat(data));
            this.writer.writeFileSync(filePath, dv);
            notify.next(target);
            notify.complete();
          });
      })
      .on('error', (err) => notify.error(err))
      .end();
    return notify.asObservable();
  }
}
