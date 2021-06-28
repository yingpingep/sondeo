import { Writer } from './interfaces/interfaces';
import fs from 'fs';
import { Observable, Subject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

export class WriterImpl implements Writer {
  writeFile(path: string, data: DataView): Observable<void> {
    const obj = new Subject<void>();

    fs.writeFile(path, data, () => {
      obj.next();
      obj.complete();
    });
    return obj.asObservable().pipe(shareReplay(1));
  }
}
