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
    const request = indexedDB.open(this.DB_NAME, this.VERSION);
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
    request.onsuccess = (event) => {
      this.db = event.target.result;
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
  async selectAllTexts() {
    return this.getDB().then(db => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], "readonly");
        const store = transaction.objectStore(this.STORE_NAME);
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = (e) => {
          resolve(e.target.result);
        };
        getAllRequest.onerror = (e) => {
          reject(e.target.error);
        };
      });
    });
  }

  /**
   * Retrieves text records that partially match the given text with optional case sensitivity.
   * @param {string} searchText - The text to search for.
   * @param {boolean} [caseSensitive=true] - Whether the search is case sensitive.
   * @returns {Promise<Array>} Resolves with an array of matching text records.
   */
  async selectByText(searchText, caseSensitive = true) {
    return this.getDB().then(db => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], "readonly");
        const store = transaction.objectStore(this.STORE_NAME);
        const index = store.index("text");
        const matchedResults = [];
        const cursorRequest = index.openCursor();
        cursorRequest.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            let recordText = cursor.value.text;
            let target = searchText;
            if (!caseSensitive) {
              recordText = recordText.toLowerCase();
              target = target.toLowerCase();
            }
            if (recordText.includes(target)) {
              matchedResults.push(cursor.value);
            }
            cursor.continue();
          } else {
            resolve(matchedResults);
          }
        };
        cursorRequest.onerror = (e) => {
          reject(e.target.error);
        };
      });
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
