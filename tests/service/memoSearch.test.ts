import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderMemoSearch } from '../../src/service/memoSearch';
import { memoContentDB } from '../../src/db';
import { MemoContent } from '../../src/model';
import { getMemoDto } from '../../src/service/memo';
import { generateMemoHistoryContent } from '../../src/service/memoHistory';

vi.spyOn(memoContentDB, 'selectByKeyword').mockResolvedValue([]);

vi.mock('../../src/service/memo', () => ({
  getMemoDto: vi.fn(),
}));

vi.mock('../../src/service/memoHistory', () => ({
  generateMemoHistoryContent: vi.fn(() => {
    const div = document.createElement('div');
    div.textContent = 'preview';
    return div;
  }),
}));

describe('renderMemoSearch', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    document.body.innerHTML = `
      <div id="search-results" class="w-full"></div>
      <div id="search-preview" class="hidden"></div>
    `;
  });

  it('returns early when keyword is empty', async () => {
    await renderMemoSearch('', false);
    expect(memoContentDB.selectByKeyword).not.toHaveBeenCalled();
    expect(document.getElementById('search-results')!.children).toHaveLength(0);
  });

  it('renders “No results found.” and hides preview when no match', async () => {
    await renderMemoSearch('keyword', false);

    const results = document.getElementById('search-results')!;
    const preview = document.getElementById('search-preview')!;

    expect(results.textContent).toBe('No results found.');
    expect(preview.classList.contains('hidden')).toBe(true);
    expect(results.classList.contains('w-full')).toBe(true);
  });

  it('lists memo buttons and opens preview on click', async () => {
    const memoDto = {
      id: 1,
      title: 'Test Title',
      createdAt: new Date('2025-05-10T00:00:00Z'),
      updatedAt: new Date('2025-05-10T00:00:00Z'),
      contentDtos: [
        {
          id: 1,
          text: 'Test Title\nTest text',
          createdAt: new Date('2025-05-10T00:00:00Z'),
        },
      ],
    };

    const memoContent = new MemoContent(
      1,
      1,
      'Test Title\nTest text',
      new Date('2025-05-10T00:00:00Z')
    );

    vi.mocked(memoContentDB.selectByKeyword).mockResolvedValue([memoContent]);
    vi.mocked(getMemoDto).mockResolvedValue(memoDto);

    await renderMemoSearch('keyword', false);

    const results = document.getElementById('search-results')!;
    const preview = document.getElementById('search-preview')!;

    const btns = results.querySelectorAll('button');
    expect(btns).toHaveLength(1);
    expect(btns[0].textContent).toBe('Test Title');

    btns[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(generateMemoHistoryContent).toHaveBeenCalledTimes(1);
    expect(preview.classList.contains('hidden')).toBe(false);
    expect(results.classList.contains('w-1/2')).toBe(true);
  });
});
