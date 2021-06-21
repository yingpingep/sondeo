import { MediaGroups, Playlist, Segment } from 'm3u8-parser';
import { Observable } from 'rxjs';

export class Data {
  index: string | undefined;
  parts: string[] | undefined;

  constructor(public name: string) {}
}

export interface Encoder {}

export interface Downloader {
  download(data: Data, path: string): Observable<string>;
}

export interface Parser {
  parse(index: ArrayBuffer): Manifest;
}

export interface Writer {
  writeFileSync(path: string, data: DataView): void;
}

export interface Manifest {
  allowCache: boolean;
  discontinuityStarts: any[];
  segments: Segment[];
  playlists: Playlist[];
  mediaGroups: MediaGroups;
}

export interface Injector {
  get<T>(token: any, ...args: any): T;
}
