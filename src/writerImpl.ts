import { Writer } from './interfaces/interfaces';
import fs from 'fs';
import { Observable } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';

export class WriterImpl implements Writer {
  writeFile(path: string, data: DataView): Observable<void> {
    return fromPromise(fs.promises.writeFile(path, Buffer.from(data.buffer)));
  }
}
