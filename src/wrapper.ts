import { Observable, Subject } from 'rxjs';
import http, { ClientRequest, IncomingMessage } from 'http';
import fs from 'fs';

export class Wrapper {
  private url: URL;
  private outPath: string;
  constructor(target: string, outPath: string) {
    this.url = new URL(target);
    this.outPath = outPath;

    console.log(this.url, this.outPath);
  }
}
