import { IndexedDB } from './IndexedDB.js';
import { Text } from './Text.js';

export class TextDB extends IndexedDB {
  constructor() {
    super("memoApp", 1);
    this.STORE_NAME = "text";
  }

  /**
   * Initializes the database (creates object store and indexes if needed).
   */
  initDB() {
    const request = this.connect();
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(this.STORE_NAME)) {
        const objectStore = db.createObjectStore(this.STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        objectStore.createIndex("text", "text", { unique: false });
        objectStore.createIndex("create_at", "create_at", { unique: false });
      }
    };
    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
    };
  }

  /**
   * Saves the given text to IndexedDB.
   * @param {string} text - The text to save.
   * @returns {Promise} Resolves if save is successful.
   */
  async saveText(text) {
    const textEntity = new Text({ text: text, create_at: new Date().toISOString() });
    return this.insert(this.STORE_NAME, textEntity.generateRow());
  }

  /**
   * Updates a text record in IndexedDB.
   * @param {object} record - The record to update.
   * @returns {Promise} Resolves if update is successful.
   */
  async updateText(record) {
    return this.update(this.STORE_NAME, record);
  }

  /**
   * Retrieves all text records from IndexedDB.
   * @returns {Promise<Array>} Resolves with an array of text records.
   */
  async getAllTexts() {
    return new Promise((resolve, reject) => {
      const request = this.connect();
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([this.STORE_NAME], "readonly");
        const store = transaction.objectStore(this.STORE_NAME);
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = (e) => {
          resolve(e.target.result);
        };
        getAllRequest.onerror = (e) => {
          reject(e.target.error);
        };
      };
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Deletes a text record by its id from IndexedDB.
   * @param {number} id - The id of the text record to delete.
   * @returns {Promise} Resolves if deletion is successful.
   */
  async deleteById(id = 0) {
    return super.deleteById(this.STORE_NAME, id);
  }
}
