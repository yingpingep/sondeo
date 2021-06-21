import { Observable, Subject } from 'rxjs';
import https, { Agent } from 'https';
import fs from 'fs';
import { RequestOptions } from 'https';
import { map } from 'rxjs/operators';
import { Data, Downloader, Injector, Parser } from './interfaces/interfaces';

export interface IndexResult {
  isLocalFile: boolean;
  location: string;
}
export class Wrapper {
  private url: URL;
  private initiateFile: string;
  private readonly outPath: string;
  private readonly agent: Agent;
  private data: Data;
  private parser: Parser;
  private downloader: Downloader;

  constructor(
    target: string,
    outPath: string,
    injector: Injector,
    name = 'default'
  ) {
    this.url = new URL(target);
    this.initiateFile = this.url.pathname.split('/').slice(-1)[0];
    this.outPath = outPath;
    this.agent = new Agent({ keepAlive: true });

    this.data = new Data(name);
    this.parser = injector.get('Parser');
    this.downloader = injector.get('Downloader');
  }

  getIndex(): Observable<IndexResult> {
    return this.get(this.initiateFile).pipe(
      map((filename) => {
        const manifest = this.parser.parse(fs.readFileSync(filename));

        const hasPlaylists = manifest.playlists;
        this.data.index = hasPlaylists ? manifest.playlists[0].uri : filename;
        this.data.parts = manifest.segments.map((s) => s.uri);

        return {
          isLocalFile: !hasPlaylists,
          location: hasPlaylists ? manifest.playlists[0].uri : filename,
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

    const req = https.get(option);
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
