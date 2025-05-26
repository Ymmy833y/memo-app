import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getEditorInstance,
  createEditor,
  updateEditor,
  updateEditorWithText,
  createViewer,
  copyMarkdownText,
  clearEditorStyles,
} from '../../src/service/editor';
import EditorModule from '@toast-ui/editor';
import { setClipboardIcon } from '../../src/util';

// Mock @toast-ui/editor so that Editor(...) and Editor.factory both exist
vi.mock('@toast-ui/editor', () => {
  const mockEditor = vi.fn().mockImplementation(function (this: any, opts: any) {
    this.opts = opts;
    this.getMarkdown = () => opts.initialValue || '';
    this.getHTML     = () => '<p data-task="1" style="color:red;">Hello</p>';
    this.destroy     = vi.fn();
    this.setHTML     = vi.fn();
  });
  // attach factory on the default export
  Object.assign(mockEditor, { factory: vi.fn() });
  return {
    __esModule: true,
    default: mockEditor,
  };
});

// Mock theme to always be 'light'
vi.mock('../../src/service/theme', () => ({
  getCurrentTheme: vi.fn(() => 'light'),
}));

// Mock setClipboardIcon
vi.mock('../../src/util', () => ({
  setClipboardIcon: vi.fn(),
}));

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

describe('editor', () => {
  beforeEach(() => {
    // mount point for the editor
    document.body.innerHTML = '<div id="editor"></div>';
    // clear any previous module state
    vi.clearAllMocks();
  });

  describe('getEditorInstance', () => {
    it('returns null before creation', () => {
      expect(getEditorInstance()).toBeNull();
    });
  });

  describe('createEditor', () => {
    it('throws if the mount element is missing', () => {
      document.body.innerHTML = '';
      expect(() => createEditor('')).toThrow('Editor mount element (#editor) not found');
    });

    it('initializes Editor and returns the instance', () => {
      const editor = createEditor('initial-content');
      // default export is a mock constructor
      expect(EditorModule).toHaveBeenCalled();
      expect(getEditorInstance()).toBe(editor);
      expect(editor.getMarkdown()).toBe('initial-content');
    });
  });

  describe('updateEditor', () => {
    it('re-creates the editor preserving its content', () => {
      const first = createEditor('foo');
      // override markdown to simulate user edits
      first.getMarkdown = () => 'foo-content';
      updateEditor();
      const second = getEditorInstance();
      // new instance
      expect(second).not.toBe(first);
      expect((second as any).opts.initialValue).toBe('foo-content');
    });
  });

  describe('updateEditorWithText', () => {
    it('recreates editor with the specified text', () => {
      createEditor('old');
      updateEditorWithText('new-text');
      const editor = getEditorInstance();
      expect((editor as any).opts.initialValue).toBe('new-text');
    });
  });

  describe('createViewer', () => {
    it('calls Editor.factory with correct parameters', () => {
      const container = document.createElement('div');
      createViewer(container, 'view-text');
      // factory was attached to the default export
      expect((EditorModule as any).factory).toHaveBeenCalledWith({
        el: container,
        viewer: true,
        theme: 'light',
        initialValue: 'view-text',
        plugins: expect.any(Array),
      });
    });
  });

  describe('copyMarkdownText', () => {
    it('strips HTML, writes to clipboard, and sets check icon', async () => {
      createEditor('md<em>test</em>');
      await copyMarkdownText();
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('mdtest');
      expect(setClipboardIcon).toHaveBeenCalledWith('check');
    });
  });

  describe('clearEditorStyles', () => {
    it('removes all attributes except preserved ones', () => {
      const editor = createEditor('');
      clearEditorStyles();
      expect(editor.setHTML).toHaveBeenCalled();
      const cleaned = (editor.setHTML as any).mock.calls[0][0];
      expect(cleaned).toBe('<p data-task="1">Hello</p>');
    });
  });

  describe('window resize listener', () => {
    it('updates the editor height style on resize', () => {
      const mountEl = document.getElementById('editor') as HTMLDivElement;
      Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
      window.dispatchEvent(new Event('resize'));
      expect(mountEl.style.height).toBe('600px');
    });
  });
});
