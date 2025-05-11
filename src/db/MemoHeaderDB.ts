import { BaseDB } from './BaseDB';
import { MemoHeader } from '../model';

class MemoHeaderDB extends BaseDB<MemoHeader> {
  constructor() {
    super('memo_header');
  }

  initStore(event: IDBVersionChangeEvent): void {
    const db = (event.target as IDBOpenDBRequest).result;
    if (!db.objectStoreNames.contains(this.storeName)) {
      const store = db.createObjectStore(this.storeName, {
        keyPath: 'id',
        autoIncrement: true,
      });
      store.createIndex('title', 'title', { unique: false });
      store.createIndex('created_at', 'created_at', { unique: false });
      store.createIndex('updated_at', 'updated_at', { unique: false });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected convertToRow(entity: MemoHeader): any {
    return entity.generateRow();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected convertToEntity(row: any): MemoHeader {
    return MemoHeader.fromRow(row);
  }

  async selectByTitle(title: string): Promise<MemoHeader | undefined> {
    const optionalMemoHeader = await this.selectExample('title', title);
    if (optionalMemoHeader.length !== 0) {
      return optionalMemoHeader[0];
    }
    return undefined;
  }
}

export const memoHeaderDB = new MemoHeaderDB();
