import { Injectable } from '@angular/core';
import { Observable, fromEvent, first, finalize, map } from 'rxjs';

@Injectable()
export class FileService {

  constructor() { }

  loadFile(accept: string): Observable<File> {
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    input.accept = accept;

    document.body.appendChild(input);

    let obs = fromEvent(input, 'change').pipe(
      first(),
      finalize(() => document.body.removeChild(input)),
      map(() => {
        if (!input.files || input.files.length == 0) {
          throw Error('something went wrong');
        }
        return input.files[0];
      }),
    );

    input.click();
    return obs;
  }
}
