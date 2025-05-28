import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderAllMemos } from '../../src/service/allMemos';
import { MemoHeader } from '../../src/model';
import { memoHeaderDB } from '../../src/db';
import { applyMemoToEditor, getMemo, getMemoDto } from '../../src/service/memo';
import * as util from '../../src/util'

// stub out utility functions and objects
vi.mock('../../src/util', () => ({
  defaultModal: { setModal: vi.fn(), show: vi.fn(), hide: vi.fn() },
  escapeHTML: (s: string) => s,
  formatDate: (d: Date) => d.toISOString(),
  generateConfirmModalContent: vi.fn(),
  ModalSize: { XXL: 'xxl', DEFAULT: 'default' },
  hideSideMenu: vi.fn(),
}));

// stub out memo-related functions to avoid side effects
vi.mock('../../src/service/memo', () => ({
  applyMemoToEditor: vi.fn(),
  getMemo: vi.fn(async (_: number) => ({})),
  getMemoDto: vi.fn(async (_: number) => ({})),
  removeMemo: vi.fn(),
}));

// stub out memoHistory-related functions
vi.mock('../../src/service/memoHistory', () => ({
  generateMemoHistoryContent: vi.fn(),
}));

describe('renderAllMemos', () => {
  beforeEach(async () => {
    // set up a clean container in the document
    document.body.innerHTML = '<div id="all-memos"></div>';

    await memoHeaderDB.insert(new MemoHeader(1, 'Test Title 1', new Date('2025-05-01T00:00:00Z'), new Date('2025-05-01T00:00:00Z')));
    await memoHeaderDB.insert(new MemoHeader(2, 'Test Title 2', new Date('2025-05-02T00:00:00Z'), new Date('2025-05-02T00:00:00Z')));
  });

  it('should populate #all-memos with memo items sorted by updatedAt descending', async () => {
    // execute the rendering logic
    await renderAllMemos();

    // find the container and its generated wrapper div
    const container = document.getElementById('all-memos')!;
    const wrapper = container.firstElementChild as HTMLElement;

    // wrapper should contain one <li> per memoHeader
    expect(wrapper.children).toHaveLength(2);

    // verify that the first <li> corresponds to the header with the later date (id 2)
    const [firstLi, secondLi] = Array.from(wrapper.children) as HTMLElement[];
    expect(firstLi.dataset.id).toBe('2');
    expect(secondLi.dataset.id).toBe('1');

    // Click the display button
    const displayBtns = document.querySelectorAll<HTMLButtonElement>('button.display-btn');
    expect(displayBtns).toHaveLength(2);
    displayBtns[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();
    expect(getMemo).toHaveBeenCalled();
    expect(applyMemoToEditor).toHaveBeenCalled();
    expect(util.hideSideMenu).toHaveBeenCalled();

    // Click the details button
    const detailsBtns = document.querySelectorAll<HTMLButtonElement>('button.details-btn');
    expect(detailsBtns).toHaveLength(2);
    detailsBtns[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();
    expect(getMemoDto).toHaveBeenCalled();

    // Click the delete button
    const deleteBtns = document.querySelectorAll<HTMLButtonElement>('button.delete-btn');
    expect(deleteBtns).toHaveLength(2);
    deleteBtns[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();
    expect(util.generateConfirmModalContent).toHaveBeenCalled();
  });
});
