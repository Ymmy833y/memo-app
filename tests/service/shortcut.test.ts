import { describe, it, beforeEach, expect, vi } from 'vitest';
import * as editor from '../../src/service/editor.js';
import * as memo from '../../src/service/memo.js';
import { initializeShortcuts } from '../../src/service/shortcut.js';

let execMock: ReturnType<typeof vi.fn>;
let clearEditorStylesMock: ReturnType<typeof vi.fn>;
let copyMarkdownTextMock: ReturnType<typeof vi.fn>;
let saveMemoMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  execMock = vi.fn();
  clearEditorStylesMock = vi.fn();
  copyMarkdownTextMock = vi.fn();
  saveMemoMock = vi.fn();

  vi.spyOn(editor, 'getEditorInstance').mockReturnValue({ exec: execMock } as any);
  vi.spyOn(editor, 'clearEditorStyles').mockImplementation(clearEditorStylesMock);
  vi.spyOn(editor, 'copyMarkdownText').mockImplementation(copyMarkdownTextMock);
  vi.spyOn(memo, 'saveMemo').mockImplementation(saveMemoMock);

  document.body.innerHTML = `
    <div id="search-modal" class="hidden"></div>
    <input id="search-input" />
  `;

  initializeShortcuts();
});

function fireShortcut(key: string, { ctrl = false, alt = false, shift = false } = {}) {
  const e = new KeyboardEvent('keydown', {
    key,
    ctrlKey: ctrl,
    altKey: alt,
    shiftKey: shift,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(e);
}

describe('commandMapping via keyboard', () => {
  const headingKeys = ['1', '2', '3', '4', '5', '6'];

  headingKeys.forEach((key, idx) => {
    it(`executes heading level ${idx + 1} on Ctrl+Alt+${key}`, () => {
      fireShortcut(key, { ctrl: true, alt: true });
      expect(execMock).toHaveBeenCalledWith('heading', { level: idx + 1 });
    });
  });

  it('executes paragraph heading (level 0)', () => {
    fireShortcut('0', { ctrl: true, alt: true });
    expect(execMock).toHaveBeenCalledWith('heading', { level: 0 });
  });

  it('executes bold', () => {
    fireShortcut('b', { ctrl: true });
    expect(execMock).toHaveBeenCalledWith('bold');
  });

  it('executes italic', () => {
    fireShortcut('i', { ctrl: true });
    expect(execMock).toHaveBeenCalledWith('italic');
  });

  it('executes strike', () => {
    fireShortcut('s', { ctrl: true });
    expect(execMock).toHaveBeenCalledWith('strike');
  });

  it('executes quote', () => {
    fireShortcut('q', { ctrl: true, shift: true });
    expect(execMock).toHaveBeenCalledWith('blockQuote');
  });

  it('executes bulletList', () => {
    fireShortcut('u', { ctrl: true });
    expect(execMock).toHaveBeenCalledWith('bulletList');
  });

  it('executes orderedList', () => {
    fireShortcut('o', { ctrl: true });
    expect(execMock).toHaveBeenCalledWith('orderedList');
  });

  it('executes taskList', () => {
    fireShortcut('t', { ctrl: true, alt: true });
    expect(execMock).toHaveBeenCalledWith('taskList');
  });

  it('executes inlineCode', () => {
    fireShortcut('c', { ctrl: true, shift: true });
    expect(execMock).toHaveBeenCalledWith('code');
  });

  it('executes codeBlock', () => {
    fireShortcut('c', { ctrl: true, shift: true, alt: true });
    expect(execMock).toHaveBeenCalledWith('codeBlock');
  });

  it('executes horizontalRule', () => {
    fireShortcut('l', { ctrl: true });
    expect(execMock).toHaveBeenCalledWith('hr');
  });

  it('calls clearEditorStyles on Ctrl+Alt+X', () => {
    fireShortcut('x', { ctrl: true, alt: true });
    expect(clearEditorStylesMock).toHaveBeenCalled();
  });

  it('calls saveMemo on Ctrl+Shift+S', () => {
    fireShortcut('s', { ctrl: true, shift: true });
    expect(saveMemoMock).toHaveBeenCalled();
  });

  it('shows search modal and focuses input', () => {
    const modal = document.getElementById('search-modal')!;
    const input = document.getElementById('search-input')! as HTMLInputElement;
    const focusMock = vi.spyOn(input, 'focus');

    fireShortcut('f', { ctrl: true, shift: true });

    expect(modal.classList.contains('hidden')).toBe(false);
    expect(focusMock).toHaveBeenCalled();
  });

  it('calls copyMarkdownText on Ctrl+Alt+C', () => {
    fireShortcut('c', { ctrl: true, alt: true });
    expect(copyMarkdownTextMock).toHaveBeenCalled();
  });
});
