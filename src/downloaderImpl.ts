import { Downloader, Result } from './interfaces/interfaces';
import https, { Agent, RequestOptions } from 'https';
import { Observable, Subject } from 'rxjs';
import { take } from 'rxjs/operators';

export class DownloaderImpl implements Downloader {
  url: URL | undefined;
  private agent = new Agent({ keepAlive: true });

  download(target: string): Observable<Result> {
    const notify = new Subject<Result>();
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

    const req = https.get(option);

    req
      .on('response', (res) => {
        const data: Buffer[] = [];
        res
          .on('data', (chunk: Buffer) => {
            data.push(chunk);
          })
          .on('end', () => {
            const dv = new DataView(Buffer.concat(data));
            notify.next({
              name: target,
              data: dv,
            });
            notify.complete();
          });
      })
      .on('error', (err) => notify.error(err))
      .end();
    return notify.asObservable().pipe(take(1));
  }
}
