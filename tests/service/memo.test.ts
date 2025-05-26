import { describe, it, expect, beforeEach, vi } from 'vitest';
import { memoHeaderDB, memoContentDB, initDatabase } from '../../src/db';
import * as editorService from '../../src/service/editor';
import * as memoService from '../../src/service/memo';
import * as util from '../../src/util';
import { MemoContent, MemoDto, MemoHeader } from '../../src/model';

const FIXED_DATE = new Date('2025-05-03T00:01:00Z');

describe('memo', () => {
  let setSaveIconSpy: any;

  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(FIXED_DATE);

    vi.spyOn(util, 'compressText').mockImplementation((text) => text);
    vi.spyOn(util, 'decompressText').mockImplementation((text) => text);

    setSaveIconSpy = vi.spyOn(util, 'setSaveIcon').mockImplementation(() => {});

    globalThis.indexedDB = new IDBFactory();
    await initDatabase();

    await memoHeaderDB.insert(
      new MemoHeader(
        1,
        'Test Title 1',
        new Date('2025-05-01T00:01:00Z'),
        new Date('2025-05-01T00:02:00Z')
      )
    );
    await memoHeaderDB.insert(
      new MemoHeader(
        2,
        'Test Title 2',
        new Date('2025-05-02T00:01:00Z'),
        new Date('2025-05-02T00:01:00Z')
      )
    );
    await memoContentDB.insert(
      new MemoContent(
        1,
        1,
        'Test Title 1\nTest text 1-1',
        new Date('2025-05-01T01:00:00Z')
      )
    );
    await memoContentDB.insert(
      new MemoContent(
        2,
        1,
        'Test Title 1\nTest text 1-2',
        new Date('2025-05-01T02:00:00Z')
      )
    );
    await memoContentDB.insert(
      new MemoContent(
        3,
        2,
        'Test Title 2\nTest text 2-1',
        new Date('2025-05-02T01:00:00Z')
      )
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('saveMemo', () => {
    it('returns early when there is no editor instance', async () => {
      vi.spyOn(editorService, 'getEditorInstance').mockReturnValue(null);

      await memoService.saveMemo();
      expect(setSaveIconSpy).not.toHaveBeenCalled();
    });

    it('should not save when title cannot be identified', async () => {
      const fakeEditor = { getMarkdown: () => '' } as any;

      vi.spyOn(editorService, 'getEditorInstance').mockReturnValue(fakeEditor);
      vi.spyOn(memoService, 'retrieveValidTitle').mockReturnValue(null);
      const selectByTitleSpy = vi.spyOn(memoHeaderDB, 'selectByTitle');

      await memoService.saveMemo();
      expect(selectByTitleSpy).not.toHaveBeenCalled();
      expect(setSaveIconSpy).toHaveBeenCalledTimes(1);
    });

    it('should create new entry when title does not exist', async () => {
      const fakeEditor = {
        getMarkdown: () => 'New Test Title 3\nNew Test Text 3-1',
      } as any;
      vi.spyOn(editorService, 'getEditorInstance').mockReturnValue(fakeEditor);
      const updateSpy = vi.spyOn(memoHeaderDB, 'update');

      await memoService.saveMemo();
      expect(updateSpy).not.toHaveBeenCalled();

      const memoHeaders = await memoHeaderDB.selectAll();
      expect(memoHeaders).toHaveLength(3);
      const newMemoHeader = memoHeaders[memoHeaders.length - 1];
      expect(newMemoHeader).toBeInstanceOf(MemoHeader);
      expect(newMemoHeader.getTitle()).toBe('New Test Title 3');

      const memoContents = await memoContentDB.selectAll();
      expect(memoContents).toHaveLength(4);
      const newMemoContent = memoContents[memoContents.length - 1];
      expect(newMemoContent).toBeInstanceOf(MemoContent);
      expect(newMemoContent.getText()).toBe(
        'New Test Title 3\nNew Test Text 3-1'
      );
    });

    it('should update when title exists and memo content has changed', async () => {
      const fakeEditor = {
        getMarkdown: () => 'Test Title 1\nNew Test Text 1-3',
      } as any;
      vi.spyOn(editorService, 'getEditorInstance').mockReturnValue(fakeEditor);
      const insertSpy = vi.spyOn(memoHeaderDB, 'insert');

      await memoService.saveMemo();
      expect(insertSpy).not.toHaveBeenCalled();

      const memoHeader = await memoHeaderDB.selectById(1);
      expect(memoHeader).toBeInstanceOf(MemoHeader);
      expect(memoHeader.getUpdatedAt().getTime()).toBe(FIXED_DATE.getTime());

      const memoContents = await memoContentDB.selectByHeaderId(1);
      expect(memoContents).toHaveLength(3);
      const memoContent = memoContents[2];
      expect(memoContent).toBeInstanceOf(MemoContent);
      expect(memoContent.getText()).toBe('Test Title 1\nNew Test Text 1-3');
    });

    it('should only update dates when title exists and memo content matches', async () => {
      const fakeEditor = {
        getMarkdown: () => 'Test Title 1\nTest text 1-2',
      } as any;
      vi.spyOn(editorService, 'getEditorInstance').mockReturnValue(fakeEditor);
      const insertSpy = vi.spyOn(memoHeaderDB, 'insert');

      await memoService.saveMemo();
      expect(insertSpy).not.toHaveBeenCalled();

      const memoHeader = await memoHeaderDB.selectById(1);
      expect(memoHeader).toBeInstanceOf(MemoHeader);
      expect(memoHeader.getUpdatedAt().getTime()).toBe(FIXED_DATE.getTime());

      const memoContents = await memoContentDB.selectByHeaderId(1);
      expect(memoContents).toHaveLength(2);
      const memoContent = memoContents[1];
      expect(memoContent).toBeInstanceOf(MemoContent);
      expect(memoContent.getCreatedAt().getTime()).toBe(FIXED_DATE.getTime());
      expect(memoContent.getText()).toBe('Test Title 1\nTest text 1-2');
    });
  });

  describe('getMemoDto', () => {
    it('throws an error when the id does not exist', async () => {
      await expect(memoService.getMemoDto(999)).rejects.toThrowError(
        'No data found'
      );
    });

    it('returns a valid MemoDto when the id exists', async () => {
      const actual = await memoService.getMemoDto(1);
      expect(actual.id).toBe(1);
      expect(actual.title).toBe('Test Title 1');
      expect(Array.isArray(actual.contentDtos)).toBe(true);
      expect(actual.contentDtos).toHaveLength(2);
      expect(actual.contentDtos[0]).toMatchObject({
        text: 'Test Title 1\nTest text 1-1',
      });
      expect(actual.contentDtos[1]).toMatchObject({
        text: 'Test Title 1\nTest text 1-2',
      });
    });
  });

  describe('getMemo', () => {
    it('returns a valid Memo when the id exists', async () => {
      const actual = await memoService.getMemo(1);
      expect(actual.id).toBe(1);
      expect(actual.text).toBe('Test Title 1\nTest text 1-2');
    });
  });

  describe('removeMemo', () => {
    it('should delete all matching memos', async () => {
      const memoDto: MemoDto = {
        id: 1,
        title: 'Test Title 1',
        createdAt: new Date('2025-05-01T00:01:00Z'),
        updatedAt: new Date('2025-05-01T00:02:00Z'),
        contentDtos: [
          {
            id: 1,
            text: 'Test Title 1\nTest text 1-1',
            createdAt: new Date('2025-05-01T01:00:00Z'),
          },
          {
            id: 2,
            text: 'Test Title 1\nTest text 1-2',
            createdAt: new Date('2025-05-01T02:00:00Z'),
          },
        ],
      };

      await memoService.removeMemo(memoDto);

      await expect(memoHeaderDB.selectById(1)).rejects.toThrowError(
        'No data found'
      );
      const memoContents = await memoContentDB.selectByHeaderId(1);
      expect(memoContents).toHaveLength(0);
    });
  });

  describe('retrieveValidTitle', () => {
    it('returns null for an empty string', () => {
      expect(memoService.retrieveValidTitle('')).toBeNull();
    });

    it('returns null for strings with only newlines', () => {
      expect(memoService.retrieveValidTitle('\n\n\r\n')).toBeNull();
    });

    it('returns the first non-empty line', () => {
      const text = '\n  \nFirst Title\nSecond Title';
      expect(memoService.retrieveValidTitle(text)).toBe('First Title');
    });

    it('handles CRLF line endings correctly', () => {
      const text = 'Line1\r\nLine2\r\nLine3';
      expect(memoService.retrieveValidTitle(text)).toBe('Line1');
    });

    it('skips lines that are only HTML tags or whitespace when stripped', () => {
      const text = '<p>   </p>\n   \nActual Title\nOther';
      expect(memoService.retrieveValidTitle(text)).toBe('Actual Title');
    });

    it('returns the raw line even if it contains HTML tags, as long as stripped text is non-empty', () => {
      const text = '<h1>Title</h1>\nContent';
      expect(memoService.retrieveValidTitle(text)).toBe('<h1>Title</h1>');
    });

    it('trims whitespace around a valid line', () => {
      const text = '   Trimmed Title   \nNext';
      expect(memoService.retrieveValidTitle(text)).toBe('   Trimmed Title   ');
    });

    it('returns null if all lines are empty or only tags', () => {
      const text = '<div></div>\n<p></p>\n   ';
      expect(memoService.retrieveValidTitle(text)).toBeNull();
    });
  });
});
