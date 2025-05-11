import { retrieveValidTitle } from './memo';
import { memoContentDB, memoHeaderDB } from '../db';
import { MemoContent, MemoHeader } from '../model';
import { compressText } from '../util';

const OLD_DB_NAME = 'memoApp';

/**
 * If the old DB (OLD_DB_NAME) exists, returns all records from the 'text' store;
 * otherwise returns an empty array.
 * Note: If the DB did not exist, the newly created old DB is deleted to avoid accidental retention.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchOldData(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(OLD_DB_NAME);
    let existed = true;

    req.onupgradeneeded = (e) => {
      const oldVersion = (e.oldVersion ?? 0);
      if (oldVersion === 0) {
        existed = false;
      }
    };

    req.onsuccess = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      db.close();

      if (!existed) {
        // If the DB did not exist, return an empty array and delete the newly created old DB
        indexedDB.deleteDatabase(OLD_DB_NAME);
        return resolve([]);
      }

      // If the DB existed, reopen it and read the 'text' store
      const readReq = indexedDB.open(OLD_DB_NAME);
      readReq.onsuccess = (ev) => {
        const oldDb = (ev.target as IDBOpenDBRequest).result;
        const tx = oldDb.transaction('text', 'readonly');
        const store = tx.objectStore('text');
        const getAllReq = store.getAll();

        getAllReq.onsuccess = () => {
          resolve(getAllReq.result);
          oldDb.close();
        };
        getAllReq.onerror = () => reject(getAllReq.error);
      };
      readReq.onerror = () => reject(readReq.error);
    };

    req.onerror = () => reject(req.error);
  });
}


/**
 * Insert old data into the new DB.
 */
async function insertToNewDB(rows: { id: number, text: string, create_at: string }[]): Promise<void> {
  if (rows.length === 0) return;
  const formattedTextEntries = rows
    .sort((a, b) => a.id - b.id)
    .map((row) => {
      return {
        id: row.id,
        title: retrieveValidTitle(row.text) || '# No Title',
        text: row.text,
        createdAt: new Date(row.create_at),
      };
    });

  const groupedByTitle = formattedTextEntries.reduce<Record<string, { text: string, createdAt: Date }[]>>(
    (acc, entry) => {
      if (!acc[entry.title]) {
        acc[entry.title] = [];
      }
      acc[entry.title].push({
        text: entry.text,
        createdAt: entry.createdAt
      });
      return acc;
    },
    {}
  );

  for (const [title, contents] of Object.entries(groupedByTitle)) {
    let memoHeader = new MemoHeader(undefined, title, new Date(contents[0].createdAt), new Date(contents[contents.length - 1].createdAt));
    memoHeader = await memoHeaderDB.insert(memoHeader);
    contents.forEach(content => {
      const memoContent = new MemoContent(undefined, memoHeader.getId(), compressText(content.text), new Date(content.createdAt));
      memoContentDB.insert(memoContent);
    });
  }
}

/**
 * Delete the old DB.
 */
async function deleteOldDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const delReq = indexedDB.deleteDatabase(OLD_DB_NAME);
    delReq.onsuccess = () => resolve();
    delReq.onerror   = () => reject(delReq.error);
  });
}

/**
 * Migrate data from the old DB to the new DB.
 * If the old DB does not exist, nothing is done.
 */
export const migrateOldDB = async (): Promise<void> => {
  try {
    const oldData = await fetchOldData();
    if (oldData.length === 0) {
      return;
    }
    await insertToNewDB(oldData);
    await deleteOldDB();
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}
