import { Injectable } from '@angular/core';

const MEDIA_DATABASE = 'MediaDatabase';
const MEDIA_OBJECT_STORE = 'media';
type MEDIA_KEY_TYPE = string;
type MEDIA_DATA_TYPE = {
  id: MEDIA_KEY_TYPE,
  type: string,
  name: string,
  file: BlobPart,
};

@Injectable()
export class IndexeddbService {

  async saveMedia(mediaFile: File): Promise<{ id: MEDIA_KEY_TYPE; error?: Event }> {
    return new Promise((resolve, reject) => {
      // Open IndexedDB
      const openDB = indexedDB.open(MEDIA_DATABASE, 1);

      openDB.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(MEDIA_OBJECT_STORE)) {
          db.createObjectStore(MEDIA_OBJECT_STORE, { keyPath: "id" });
        }
      };

      openDB.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Convert file to an ArrayBuffer for storage
        const reader = new FileReader();
        reader.readAsArrayBuffer(mediaFile);

        reader.onloadend = function () {
          if (!reader.result) {
            reject(new Error("Reader result is null"));
            return;
          }

          const mediaData: MEDIA_DATA_TYPE = {
            id: mediaFile.name,
            type: mediaFile.type,
            name: mediaFile.name,
            file: reader.result,
          };

          // Open a new transaction INSIDE `onloadend`
          const transaction = db.transaction(MEDIA_OBJECT_STORE, "readwrite");
          const store = transaction.objectStore(MEDIA_OBJECT_STORE);

          const request = store.put(mediaData);

          request.onsuccess = () => {
            console.log("Media saved!");
            resolve({ id: mediaData.id });
          };

          request.onerror = (event) => {
            reject({ error: event });
          };
        };
      };

      openDB.onerror = (event) => {
        reject({ error: event });
      };
    });
  }

  async loadMedia(movieId: MEDIA_KEY_TYPE): Promise<File> {
    return new Promise((resolve, reject) => {
      const dbRequest = indexedDB.open(MEDIA_DATABASE, 1);
      dbRequest.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(MEDIA_OBJECT_STORE, "readonly");
        const store = transaction.objectStore(MEDIA_OBJECT_STORE);
        const getRequest = store.get(movieId);

        getRequest.onsuccess = function () {
          const media: MEDIA_DATA_TYPE = getRequest.result;
          if (media) {
            console.log("Retrieved Movie:", media);

            // Convert back to File (optional)
            const fileBlob = new Blob([media.file], { type: media.type });
            const file = new File([fileBlob], media.name, { type: media.type });
            console.log("File Restored:", file);
          }
        };
      };
    });
  }
}
