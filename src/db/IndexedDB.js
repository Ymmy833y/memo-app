/**
 * Base class for IndexedDB operations.
 */
export class IndexedDB {
  constructor(dbName, version) {
    this.DB_NAME = dbName;
    this.VERSION = version;
  }

  /**
   * Opens a connection to the IndexedDB.
   * @returns {IDBOpenDBRequest}
   */
  connect() {
    return indexedDB.open(this.DB_NAME, this.VERSION);
  }

  /**
   * Inserts a record into the specified object store.
   * @param {string} storeName - The object store name.
   * @param {object} record - The record to insert.
   * @returns {Promise} Resolves with the inserted record id if successful.
   */
  insert(storeName, record) {
    return new Promise((resolve, reject) => {
      const request = this.connect();
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([storeName], "readwrite");
        const objectStore = transaction.objectStore(storeName);
        const addRequest = objectStore.add(record);
        addRequest.onsuccess = () => resolve({ message: "success", id: addRequest.result });
        addRequest.onerror = (e) => reject({ message: e.target.error });
      };
      request.onerror = (event) => reject({ message: event.target.error });
    });
  }

  /**
   * Updates a record in the specified object store.
   * @param {string} storeName - The object store name.
   * @param {object} record - The record to update (must include the key).
   * @returns {Promise} Resolves if update is successful.
   */
  update(storeName, record) {
    return new Promise((resolve, reject) => {
      const request = this.connect();
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([storeName], "readwrite");
        const objectStore = transaction.objectStore(storeName);
        const putRequest = objectStore.put(record);
        putRequest.onsuccess = () => resolve({ message: "success" });
        putRequest.onerror = (e) => reject({ message: e.target.error });
      };
      request.onerror = (event) => reject({ message: event.target.error });
    });
  }

  /**
   * Deletes a record from the specified object store by its id.
   * @param {string} storeName - The object store name.
   * @param {number} id - The id of the record to delete.
   * @returns {Promise} Resolves if deletion is successful.
   */
  deleteById(storeName, id) {
    return new Promise((resolve, reject) => {
      const request = this.connect();
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([storeName], "readwrite");
        const objectStore = transaction.objectStore(storeName);
        const deleteRequest = objectStore.delete(Number(id));
        deleteRequest.onsuccess = () => resolve({ message: "success" });
        deleteRequest.onerror = (e) => reject({ message: e.target.error });
      };
      request.onerror = (event) => reject({ message: event.target.error });
    });
  }
}
