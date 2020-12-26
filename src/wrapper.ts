import { Observable, Subject } from 'rxjs';
import http, { Agent } from 'http';
import fs from 'fs';
import { RequestOptions } from 'https';
import { Parser } from 'm3u8-parser';
import { map } from 'rxjs/operators';

export interface IndexResult {
  isLocalFile: boolean;
  location: string;
}
export class Wrapper {
  private url: URL;
  private initiateFile: string;
  private outPath: string;
  private agent: Agent;
  constructor(target: string, outPath: string) {
    this.url = new URL(target);
    this.initiateFile = this.url.pathname.split('/').slice(-1)[0];
    this.outPath = outPath;
    this.agent = new Agent({ keepAlive: true });
  }
  getIndex(): Observable<IndexResult> {
    return this.get(this.initiateFile).pipe(
      map((filename) => {
        const parser = new Parser();
        parser.push(fs.readFileSync(filename).toString());
        parser.end();

        const hasPlaylists = !!parser.manifest.playlists;
        return {
          isLocalFile: !hasPlaylists,
          location: hasPlaylists ? parser.manifest.playlists[0].uri : filename,
        } as IndexResult;
      })
    );
  }
  get(path: string, fileName?: string): Observable<string> {
    const notify = new Subject<string>();
    const originalPathList = this.url.pathname.split('/').slice(0, -1);
    originalPathList.push(path);

    const outputFileName = `${this.outPath}/${fileName || path}`;

    const option: RequestOptions = {
      host: this.url.host,
      path: originalPathList.join('/') + this.url.search,
      agent: this.agent,
    };

    const req = http.get(option);
    req.on('response', (res) => {
      const data: Buffer[] = [];
      res.on('data', (chunk: Buffer) => {
        data.push(chunk);
      });

      res.on('end', () => {
        fs.writeFileSync(outputFileName, Buffer.concat(data));
        notify.next(outputFileName);
        notify.complete();
      });
    });
    req.on('error', (err) => notify.error(err));
    req.end();

    return notify;
  }
}
