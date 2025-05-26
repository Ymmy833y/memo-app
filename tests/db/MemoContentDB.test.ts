import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initDatabase, memoContentDB } from '../../src/db';
import { MemoContent } from '../../src/model';

vi.mock('../../src/util', () => ({
  decompressText: (text: string) => text,
}));

describe('MemoContentDB', () => {
  beforeEach(async () => {
    globalThis.indexedDB = new IDBFactory();
    await initDatabase();

    await memoContentDB.insert(MemoContent.fromRequiredArgs(1, 'Test Text 1'));
    await memoContentDB.insert(MemoContent.fromRequiredArgs(1, 'Test Text 2'));
    await memoContentDB.insert(MemoContent.fromRequiredArgs(2, 'Test text 3'));
  });

  describe('selectByHeaderId', () => {
    it('should retrieve all records matching the headerId', async () => {
      const actual = await memoContentDB.selectByHeaderId(1);
      expect(actual).toHaveLength(2);
      expect(actual.map(c => c.getText())).toEqual(
        expect.arrayContaining(['Test Text 1', 'Test Text 2'])
      );
    });

    it('should return an empty array when no records match the headerId', async () => {
      const actual = await memoContentDB.selectByHeaderId(999);
      expect(actual).toHaveLength(0);
    });
  });

  describe('selectLatestByHeaderId', () => {
    it('should return the record with the highest id for the given headerId', async () => {
      const actual = await memoContentDB.selectLatestByHeaderId(1);
      expect(actual).toBeInstanceOf(MemoContent);
      expect(actual.getText()).toBe('Test Text 2');
    });

    it('should return null when no records exist for the given headerId', async () => {
      const latest = await memoContentDB.selectLatestByHeaderId(999);
      expect(latest).toBeNull();
    });
  });

  describe('selectByKeyword', () => {
    it('should find all records containing the keyword in case-insensitive mode', async () => {
      const res = await memoContentDB.selectAll();
      expect(res).toHaveLength(3);
      const actual = await memoContentDB.selectByKeyword('text', false);
      expect(actual).toHaveLength(3);
      expect(actual.map(c => c.getText())).toEqual(
        expect.arrayContaining(['Test Text 1', 'Test Text 2', 'Test text 3'])
      );
    });

    it('should distinguish case in case-sensitive mode', async () => {
      // lowercase 'text' only matches the entry with lowercase in its text
      const lowerActual = await memoContentDB.selectByKeyword('text', true);
      expect(lowerActual).toHaveLength(1);
      expect(lowerActual.map(c => c.getText())).toEqual(
        expect.arrayContaining(['Test text 3'])
      );

      // uppercase 'Text' matches only the entries with uppercase in their text
      const exactActual = await memoContentDB.selectByKeyword('Text', true);
      expect(exactActual).toHaveLength(2);
      expect(exactActual.map(c => c.getText())).toEqual(
        expect.arrayContaining(['Test Text 1', 'Test Text 2'])
      );
    });

    it('should return an empty array when no matches are found', async () => {
      const actual = await memoContentDB.selectByKeyword('nonexistent', false);
      expect(actual).toHaveLength(0);
    });
  });
});
