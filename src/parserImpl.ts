import { Manifest, Parser } from './interfaces/interfaces';
import { Parser as M3u8Parser } from 'm3u8-parser';

export class ParserImpl implements Parser {
  private parser = new M3u8Parser();

  parse(index: Buffer): Manifest {
    this.parser.push(index.toString());
    this.parser.end();
    return this.parser.manifest;
  }
}
