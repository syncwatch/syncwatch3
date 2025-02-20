import { Component } from '@angular/core';
import { FileService } from './shared/file/file.service';
import { IndexeddbService } from './shared/indexeddb/indexeddb.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  providers: [
    FileService,
    IndexeddbService,
  ]
})
export class AppComponent {
  constructor(private fileService: FileService, private indexeddbService: IndexeddbService) {

  }

  selectMediaFile() {
    this.fileService.loadFile('mp4').subscribe(file => {
      console.log(file);
      this.indexeddbService.saveMedia(file);
    });
  }
}
