import { BaseDB } from './BaseDB';
import { MemoContent } from '../model';
import { decompressText } from '../util';

class MemoContentDB extends BaseDB<MemoContent> {
  constructor() {
    super('memo_content');
  }

  initStore(event: IDBVersionChangeEvent): void {
    const db = (event.target as IDBOpenDBRequest).result;
    if (!db.objectStoreNames.contains(this.storeName)) {
      const store = db.createObjectStore(this.storeName, {
        keyPath: 'id',
        autoIncrement: true,
      });
      store.createIndex('header_id', 'header_id', { unique: false });
      store.createIndex('text', 'text', { unique: false });
      store.createIndex('created_at', 'created_at', { unique: false });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected convertToRow(entity: MemoContent): any {
    return entity.generateRow();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected convertToEntity(row: any): MemoContent {
    return MemoContent.fromRow(row);
  }

  async selectByHeaderId(headerId: number): Promise<MemoContent[]> {
    return await this.selectExample('header_id', headerId);
  }

  async selectLatestByHeaderId(headerId: number): Promise<MemoContent> {
    const memoContents = await this.selectByHeaderId(headerId);
    return memoContents.sort((a, b) => b.getId() - a.getId())[0] || null;
  }

  async selectByKeyword(keyword: string, caseSensitive: boolean): Promise<MemoContent[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const results: MemoContent[] = [];
      const request = store.openCursor();

      request.onerror = () => {
        reject(request.error);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      request.onsuccess = (event: any) => {
        const cursor: IDBCursorWithValue = event.target.result;
        if (cursor) {
          const record = cursor.value;
          const textToSearch = caseSensitive ? decompressText(record.text) : decompressText(record.text).toLowerCase();
          const keywordToSearch = caseSensitive ? keyword : keyword.toLowerCase();
          if (textToSearch && textToSearch.indexOf(keywordToSearch) !== -1) {
            results.push(MemoContent.fromRow(record));
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };
    });
  }
}

export const memoContentDB = new MemoContentDB();
