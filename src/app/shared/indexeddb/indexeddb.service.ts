import { Injectable } from '@angular/core';

const MEDIA_DATABASE = 'MediaDatabase';
const MEDIA_DATABASE_VERSION = 1;
const MEDIA_OBJECT_STORE = 'media';
type MEDIA_KEY_TYPE = string;
export type MEDIA_DATA_TYPE = {
  id: MEDIA_KEY_TYPE,
  type: string,
  name: string,
  file: ArrayBuffer,
};
export type IndexedDBStorage = { quota: number; usage: number; available: number; fraction: number, percentage: number };

@Injectable()
export class IndexeddbService {

  openDB(): IDBOpenDBRequest {
    const openDB = indexedDB.open(MEDIA_DATABASE, MEDIA_DATABASE_VERSION);

    openDB.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(MEDIA_OBJECT_STORE)) {
        db.createObjectStore(MEDIA_OBJECT_STORE, { keyPath: "id" });
      }
    };
    return openDB;
  }

  async saveMedia(mediaFile: File): Promise<{ id: MEDIA_KEY_TYPE; error?: Event }> {
    return new Promise((resolve, reject) => {
      const openDB = this.openDB();

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
            file: <ArrayBuffer>reader.result,
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
      const openDB = this.openDB();
      openDB.onsuccess = (event) => {
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

  async deleteMedia(media: MEDIA_DATA_TYPE): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const openDB = indexedDB.open(MEDIA_DATABASE, MEDIA_DATABASE_VERSION);

      openDB.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(MEDIA_OBJECT_STORE)) {
          reject(new Error(`Object store '${MEDIA_OBJECT_STORE}' not found`));
          return;
        }

        const transaction = db.transaction(MEDIA_OBJECT_STORE, "readwrite");
        const store = transaction.objectStore(MEDIA_OBJECT_STORE);
        const request = store.delete(media.id);

        request.onsuccess = () => {
          console.log(`Media with ID ${media.id} deleted successfully`);
          resolve(true);
        };

        request.onerror = (event) => {
          console.error("Error deleting media:", event);
          reject(false);
        };
      };

      openDB.onerror = (event) => {
        reject(new Error("Database failed to open"));
      };
    });
  }


  async getAllMedia(): Promise<MEDIA_DATA_TYPE[]> {
    return new Promise((resolve, reject) => {
      const openDB = this.openDB();

      openDB.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(MEDIA_OBJECT_STORE, "readonly");
        const store = transaction.objectStore(MEDIA_OBJECT_STORE);
        const request = store.getAll(); // Fetch all stored media files

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = (event) => {
          reject({ error: event });
        };
      };

      openDB.onerror = (event) => {
        reject({ error: event });
      };
    });
  }

  async getIndexedDBStorage(): Promise<IndexedDBStorage> {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();

      const quota = estimate.quota || 0; // Total storage available
      const usage = estimate.usage || 0; // Storage currently used
      const available = quota - usage; // Remaining storage
      const fraction = usage / quota;
      const percentage = Math.ceil(fraction * 100);
      return { quota, usage, available, fraction, percentage };
    } else {
      throw new Error("Storage API not supported");
    }
  }
}
