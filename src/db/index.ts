import { DB_NAME, DB_VERSION } from './BaseDB';
import { memoContentDB } from './MemoContentDB';
import { memoHeaderDB } from './MemoHeaderDB';

const initDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      memoContentDB.initStore(event);
      memoHeaderDB.initStore(event);
    };
    request.onsuccess = () => {
      resolve();
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request.onerror = (event: any) => {
      console.error('DB connection error:', event.target.error);
      reject(event.target.error);
    };
  });
}

export { initDatabase, memoContentDB, memoHeaderDB };
