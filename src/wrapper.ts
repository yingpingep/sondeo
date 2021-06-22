import { concat, Observable, Subject } from 'rxjs';
import { Agent } from 'https';
import {
  Data,
  Downloader,
  Injector,
  Parser,
  Status,
  Writer,
} from './interfaces/interfaces';

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

    this.downloader.url = new URL(target);
    this.downloader.download(target).subscribe((result) => {
      const manifest = this.parser.parse(result.data.buffer);
      for (const segment of manifest.segments) {
        this.data.parts.set(segment.uri, false);
      }
      const status: Status = {
        total: this.data.parts.size,
        downloaded: Array.from(this.data.parts.values()).filter((d) => d)
          .length,
      };
      notify.next(status);
    });

    concat(
      ...Array.from(this.data.parts.keys()).map((part) =>
        this.downloader.download(part)
      )
    ).subscribe({
      next: (result) => {
        const fileName = result.name.match(/(.*(\.ts|\.m3u8))(\??.*)/);
        const filePath = this.outPath + '/' + fileName;
        this.writer.writeFileSync(filePath, result.data);
        const status: Status = {
          total: this.data.parts.size,
          downloaded: Array.from(this.data.parts.values()).filter((d) => d)
            .length,
        };
        notify.next(status);
      },
      complete: notify.complete,
    });

    return notify.asObservable();
  }
}
