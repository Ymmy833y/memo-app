import { describe, it, expect, beforeEach } from 'vitest';
import { initDatabase, memoHeaderDB } from '../../src/db';
import { MemoHeader } from '../../src/model';

describe('MemoHeaderDB', () => {
  beforeEach(async () => {
    globalThis.indexedDB = new IDBFactory();
    await initDatabase();

    await memoHeaderDB.insert(MemoHeader.fromRequiredArgs('Test Title 1'));
  });

  describe('selectByTitle', () => {
    it('should retrieve data matching the title', async () => {
      const actual = await memoHeaderDB.selectByTitle('Test Title 1');
      expect(actual).toBeInstanceOf(MemoHeader);
      expect(actual?.getTitle()).toBe('Test Title 1');
    });

    it('should return undefined when no data matches the title', async () => {
      const actual = await memoHeaderDB.selectByTitle('No Such Title');
      expect(actual).toBeUndefined();
    });
  });
});
