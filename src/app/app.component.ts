import { Component } from '@angular/core';
import { FileService } from './shared/file/file.service';
import { IndexeddbService, IndexedDBStorage, MEDIA_DATA_TYPE } from './shared/indexeddb/indexeddb.service';
import { FileSizePipe } from './shared/file/file-size.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  providers: [
    FileService,
    IndexeddbService
  ],
  imports: [
    FileSizePipe
  ]
})
export class AppComponent {
  constructor(private fileService: FileService, private indexeddbService: IndexeddbService) {

  }

  ngOnInit() {
    this.refreshStats();
  }

  indexedDBStorage?: IndexedDBStorage;
  mediaList?: MEDIA_DATA_TYPE[];
  refreshingStats = true;

  async refreshStats() {
    this.indexedDBStorage = await this.indexeddbService.getIndexedDBStorage();
    this.mediaList = await this.indexeddbService.getAllMedia();
    this.refreshingStats = false;
  }

  selectMediaFile() {
    this.refreshingStats = true;
    this.fileService.loadFile('mp4').subscribe(file => {
      console.log(file);
      // TODO: check collision
      this.indexeddbService.saveMedia(file).then(() => this.refreshStats());
    });
  }

  deleteMedia(media: MEDIA_DATA_TYPE) {
    this.refreshingStats = true;
    this.indexeddbService.deleteMedia(media).then(() => this.refreshStats());
  }
}
