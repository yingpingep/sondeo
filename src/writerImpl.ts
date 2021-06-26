import { Writer } from './interfaces/interfaces';
import fs from 'fs';
import { from, Observable } from 'rxjs';

export class WriterImpl implements Writer {
  writeFile(path: string, data: DataView): Observable<void> {
    return from(fs.promises.writeFile(path, Buffer.from(data.buffer)));
  }
}
