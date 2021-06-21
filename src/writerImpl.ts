import { Writer } from './interfaces/interfaces';
import fs from 'fs';

export class WriterImpl implements Writer {
  writeFileSync(path: string, data: DataView): void {
    fs.writeFileSync(path, data);
  }
}
