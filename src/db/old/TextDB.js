import { IndexedDB } from './IndexedDB.js';
import { Text } from './Text.js';

class TextDB extends IndexedDB {
  constructor() {
    super('memoApp', 1);
    this.STORE_NAME = 'text';
    this.initDB();
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
          keyPath: 'id',
          autoIncrement: true,
        });
        objectStore.createIndex('text', 'text', { unique: false });
        objectStore.createIndex('create_at', 'create_at', { unique: false });
      }
    };
    request.onsuccess = (event) => {
      this.db = event.target.result;
    };
    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
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
        const transaction = db.transaction([this.STORE_NAME], 'readonly');
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
        const transaction = db.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const index = store.index('text');
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
 * An upsert process that verifies all records in IndexedDB, and if there is a record with an exact text match, it updates the timestamp,
 * and saves it as a new record if there is no match.
 * @param {string} text - The text to save.
 * @returns {Promise<object>} - An object containing the results and IDs of the target records.
 */
  async upsertText(text) {
    if (text.trim().length === 0) return;
    try {
      const allRecords = await this.selectAllTexts();
      const duplicate = allRecords.find((record) => record.text === text);
      if (duplicate) {
        duplicate.create_at = new Date().toISOString();
        await this.updateText(duplicate);
        console.log('Upsert: Duplicate record updated.');
        return { message: 'updated', id: duplicate.id };
      } else {
        const result = await this.saveText(text);
        console.log('Upsert: New record saved.');
        return { message: 'saved', id: result.id };
      }
    } catch (err) {
      console.error('Upsert failed:', err);
      throw err;
    }
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

// Instantiate and export as a singleton
export const textDBInstance = new TextDB();
