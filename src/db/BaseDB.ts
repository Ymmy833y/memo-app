/* eslint-disable @typescript-eslint/no-explicit-any */
export const DB_NAME = 'memo-app';
export const DB_VERSION = 1;

export abstract class BaseDB<T> {
  protected storeName: string;

  constructor(storeName: string) {
    this.storeName = storeName;
  }

  /**
   * Open the database and return a promise that resolves to the IDBDatabase object.
   * @returns {Promise<IDBDatabase>} A promise that resolves to the IDBDatabase object.
   */
  protected openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        this.initStore(event);
      };
      request.onsuccess = (event: any) => {
        resolve(event.target.result);
      };
      request.onerror = (event: any) => {
        reject(event.target.error);
      };
    });
  }

  abstract initStore(event: IDBVersionChangeEvent): void;

  protected abstract convertToRow(entity: T): any;
  protected abstract convertToEntity(row: any): T;

  /**
   * Inserts a record of type T into the database.
   *
   * @param data - The data object to be inserted.
   * @returns A promise that resolves with the result of the insert operation or rejects with an error if the operation fails.
   */
  async insert(data: T): Promise<T> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(this.convertToRow(data));
      request.onsuccess = () => {
        const id = request.result;
        const entityWithId = { ...data, id };
        resolve(this.convertToEntity(entityWithId));
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Updates a record of type T in the database.
   *
   * @param data - The data object to be updated.
   * @returns A promise that resolves with the result of the update operation or rejects with an error if the operation fails.
   */
  async update(data: T): Promise<any> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(this.convertToRow(data));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Deletes a record from the database by its ID.
   *
   * @param id - The ID of the record to be deleted.
   * @returns A promise that resolves with the result of the delete operation or rejects with an error if the operation fails.
   */
  async deleteById(id: number): Promise<any> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Selects a record from the database by its ID.
   *
   * @param id - The ID of the record to be selected.
   * @returns A promise that resolves with the selected record or rejects with an error if the operation fails.
   */
  async selectById(id: number): Promise<T> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);
      request.onsuccess = (e: any) => {
        const result = e.target.result;
        if (result !== undefined) {
          resolve(this.convertToEntity(result));
        } else {
          reject(new Error('No data found'));
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Selects all records from the database.
   *
   * @returns A promise that resolves with an array of all records or rejects with an error if the operation fails.
   */
  async selectAll(): Promise<T[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      request.onsuccess = (e: any) => {
        const results = e.target.result.map((row: any) => this.convertToEntity(row));
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Selects records from the database using an index.
   *
   * @param indexName - The name of the index to be used for selection.
   * @param value - The value to be used for selection.
   * @returns A promise that resolves with an array of selected records or rejects with an error if the operation fails.
   */
  protected async selectExample(indexName: string, value: any): Promise<T[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = (e: any) => {
        const results = e.target.result.map((row: any) => this.convertToEntity(row));
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }
}
