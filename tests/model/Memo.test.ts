import { describe, it, expect } from 'vitest';
import { convertToMemo, MemoDto, Memo } from '../../src/model';

describe('convertToMemo', () => {
  it('should pick the text of the contentDto with the highest id', () => {
    const createdAt = new Date('2025-01-01T00:00:00Z');
    const updatedAt = new Date('2025-01-02T12:34:56Z');

    const dto: MemoDto = {
      id: 42,
      title: 'ignored',
      createdAt,
      updatedAt,
      contentDtos: [
        { id: 1, text: 'first', createdAt },
        { id: 3, text: 'third', createdAt },
        { id: 2, text: 'second', createdAt },
      ],
    };

    const memo: Memo = convertToMemo(dto);

    expect(memo.id).toBe(42);
    expect(memo.createdAt).toBe(createdAt);
    expect(memo.updatedAt).toBe(updatedAt);
    expect(memo.text).toBe('third');
  });

  it('should return empty text when contentDtos is empty', () => {
    const now = new Date();
    const dto: MemoDto = {
      id: 100,
      title: 'no contents',
      createdAt: now,
      updatedAt: now,
      contentDtos: [],
    };

    const memo = convertToMemo(dto);

    expect(memo.id).toBe(100);
    expect(memo.createdAt).toBe(now);
    expect(memo.updatedAt).toBe(now);
    expect(memo.text).toBe('');
  });
});
