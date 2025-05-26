import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateMemoHistoryContent } from '../../src/service/memoHistory';
import * as editor from '../../src/service/editor';
import { applyMemoToEditor } from '../../src/service/memo';
import * as util from '../../src/util';
import { memoContentDB } from '../../src/db';

vi.mock('../../src/util', async () => {
  const actual = (await vi.importActual<typeof import('../../src/util')>(
    '../../src/util'
  )) as any;
  return {
    ...actual,
    defaultModal: { hide: vi.fn() },
    formatDate: (d: Date) => d.toISOString(),
    hideSideMenu: vi.fn(),
    hideSearchModal: vi.fn(),
    Modal: class {
      setModal = vi.fn();
    },
    ModalSize: actual.ModalSize,
  };
});

vi.mock('../../src/service/editor', () => ({
  createViewer: vi.fn((container: HTMLElement, text: string) => {
    container.textContent = text;
  }),
}));

vi.mock('../../src/service/memo', () => ({
  applyMemoToEditor: vi.fn(),
}));

describe('generateMemoHistoryContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders version buttons, version text, and initial viewer correctly', () => {
    const memoDto = {
      id: 123,
      title: 'Test Title 1',
      createdAt: new Date('2025-05-01T00:00:00Z'),
      updatedAt: new Date('2025-05-02T00:00:00Z'),
      contentDtos: [
        {
          id: 1,
          text: 'Test Title 1\nTest text 1-1',
          createdAt: new Date('2025-05-01T00:00:00Z'),
          isMatching: true,
        },
        {
          id: 2,
          text: 'Test Title 1\nTest text 1-2',
          createdAt: new Date('2025-05-02T00:00:00Z'),
        },
      ],
    };
    vi.spyOn(memoContentDB, 'deleteById').mockResolvedValue(void 0);

    const container = generateMemoHistoryContent(memoDto);
    document.body.appendChild(container);

    const versionBtns = document.querySelectorAll(
      '.space-x-2.mb-2.pb-1.flex button'
    );
    expect(versionBtns).toHaveLength(2);

    expect(versionBtns[0].textContent).toBe('v1 *');
    expect(versionBtns[1].textContent).toBe('Latest');

    const versionText = document.querySelector<HTMLDivElement>(
      '.text-lg.text-gray-500.dark\\:text-gray-300'
    )!;
    expect(versionText.textContent).toBe(
      `Version: Latest (${new Date('2025-05-02T00:00:00Z').toISOString()})`
    );

    const view = document.querySelector<HTMLElement>('#memo-viewer')!;
    expect(view.textContent).toBe('Test Title 1\nTest text 1-2');

    expect(editor.createViewer).toHaveBeenCalledOnce();
    expect(editor.createViewer).toHaveBeenCalledWith(
      view,
      'Test Title 1\nTest text 1-2'
    );

    // Click the first version button (v1)
    versionBtns[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(editor.createViewer).toHaveBeenCalledTimes(2);
    expect(editor.createViewer).toHaveBeenNthCalledWith(
      2,
      view,
      'Test Title 1\nTest text 1-1'
    );

    // Click the display button
    const displayBtn = document.querySelector<HTMLButtonElement>('button.display-btn')!;
    displayBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(applyMemoToEditor).toHaveBeenCalled();
    expect(util.hideSideMenu).toHaveBeenCalled();
    expect(util.hideSearchModal).toHaveBeenCalled();

    // Click the deleteBtn button
    const deleteButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>('button.delete-btn')
    );
    const actionDeleteBtn = deleteButtons.find(btn => btn.textContent === 'Delete');
    expect(actionDeleteBtn).toBeDefined();
    actionDeleteBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(memoContentDB.deleteById).toHaveBeenCalledWith(1);
  });
});
