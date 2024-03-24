const DB_NAME = "memoApp";
const VERSION = 1;

class IndexedDB {
  STORE_NAME;
  entity;

  conect() {
    return indexedDB.open(DB_NAME, VERSION);
  }

  async selectById(id=0) {
    return new Promise((resolve, reject) => {
      const conect = this.conect();
      conect.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([this.STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(this.STORE_NAME);
        const request = objectStore.get(Number(id));
        request.onsuccess = (e) => {
          const entity = new this.entity(e.target.result);
          resolve({ message: "success", data: entity });
        }

        request.onerror = (e) => {
          reject({ message: e.target.error, data: undefined });
        }
      }
      conect.onerror = (event) => {
        reject({ message: event.target.error, data: undefined });
      }
    });
  }

  async selectAll() {
    return new Promise((resolve, reject) => {
      const conect = this.conect();
      conect.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([this.STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(this.STORE_NAME);
        const request = objectStore.getAll();

        request.onsuccess = (e) => {
          resolve({ 
            message: "success", 
            data: (e.target.result).map(row => {
              const entity = new this.entity(row);
              return entity;
            })
          });
        }

        request.onerror = (e) => {
          reject({ message: e.target.error, data: undefined });
        }
      }
      conect.onerror = (event) => {
        reject({ message: event.target.error, data: undefined });
      }
    })
  }

  async selectExample(column, value) {
    return new Promise((resolve, reject) => {
      const conect = this.conect();
      conect.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([this.STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(this.STORE_NAME);

        const index = objectStore.index(column);
        const request = index.getAll(value);
        request.onsuccess = (e) => {
          resolve({ 
            message: "success", 
            data: (e.target.result).map(row => {
              const entity = new this.entity(row);
              return entity;
            })
          });
        }
        request.onerror = (e) => {
          reject({ message: e.target.error, data: undefined });
        }
      }
      conect.onerror = (event) => {
        reject({ message: event.target.error, data: undefined });
      }
    })
  }
  
  async innsert(row) {
    return new Promise((resolve, reject) => {
      const conect = this.conect();
      conect.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([this.STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(this.STORE_NAME);
        const request = objectStore.add(row);

        request.onsuccess = () => {
          resolve({ message: "success" });
        }

        request.onerror = (e) => {
          reject({ message: e.target.error });
        }
      }
      conect.onerror = (event) => {
        reject({ message: event.target.error });
      }
    });
  }

  async update(row) {
    return new Promise((resolve, reject) => {
      const conect = this.conect();
      conect.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([this.STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(this.STORE_NAME);
        const request = objectStore.put(row);

        request.onsuccess = () => {
          resolve({ message: "success" });
        }

        request.onerror = (e) => {
          reject({ message: e.target.error });
        }
      }
      conect.onerror = (event) => {
        reject({ message: event.target.error });
      }
    });
  }

  async deleteById(id=0) {
    return new Promise((resolve, reject) => {
      const conect = this.conect();
      conect.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([this.STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(this.STORE_NAME);

        const request = objectStore.delete(Number(id));
        request.onsuccess = (e) => {
          resolve({ message: "success" });
        }

        request.onerror = (e) => {
          reject({ message: e.target.error });
        }
      }
      conect.onerror = (event) => {
        reject({ message: event.target.error });
      }
    });
  }


  /**
   * @param {{init, db}[]} setUpDBList 
   */
  initDB(setUpDBList) {
    this.conect().onupgradeneeded = (event) => {
      setUpDBList.forEach(v => {
        console.log(v);
        v.init.call(v.db, event);
      });
    }
  }

  setUpDB() {
    return { init: this.initDB, db: this };
  }
}

class TextDB extends IndexedDB {
  STORE_NAME = "text";
  entity = Text;
  constructor() {
    super();
  }

  initDB(event) {
    const db = event.target.result;
    
    const objectStore = db.createObjectStore(this.STORE_NAME, {
      keyPath: "id",
      autoIncrement: true,
    });
    objectStore.createIndex("text", "text");
    objectStore.createIndex("create_at", "create_at");
  }
}