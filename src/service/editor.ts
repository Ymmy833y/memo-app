import '@toast-ui/editor/dist/toastui-editor.css';
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css';
import '@toast-ui/editor-plugin-color-syntax/dist/toastui-editor-plugin-color-syntax.css';
import 'prismjs/themes/prism.css';
import '@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight.css';

import Editor from '@toast-ui/editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-clojure.js';
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';
import codeSyntaxHighlight from '@toast-ui/editor-plugin-code-syntax-highlight';
import uml from '@toast-ui/editor-plugin-uml';

import { getCurrentTheme } from './theme';
import { setClipboardIcon } from '..';

/**
 * Represents the single instance of the Editor.
 *
 * This variable holds an instance of the Editor when initialized. It remains
 * null until the Editor is created or assigned. This ensures that only one
 * Editor instance exists during the application's lifecycle.
 */
let editorInstance: Editor | null = null;

/**
 * Returns the current editor instance.
 */
export const getEditorInstance = (): Editor | null => {
  return editorInstance;
}

/**
 * Initializes the editor.
 * @param initialValue - The initial content for the editor.
 * @returns The created Editor instance.
 */
export const createEditor = (initialValue = ''): Editor => {
  const mountEl = document.querySelector<HTMLDivElement>('#editor') as HTMLDivElement;
  if (!mountEl) {
    throw new Error('Editor mount element (#editor) not found');
  }

  const currentTheme = getCurrentTheme();
  const height = getEditorHeight();
  editorInstance = new Editor({
    el: mountEl,
    height,
    initialEditType: 'wysiwyg',
    previewStyle: 'vertical',
    theme: currentTheme,
    initialValue,
    plugins: [colorSyntax, [codeSyntaxHighlight, { highlighter: Prism }], uml],
  });

  return editorInstance;
}

/**
 * Re-creates the editor while preserving its content.
 */
export const updateEditor = (): void => {
  if (!editorInstance) {
    return;
  }
  const content = editorInstance.getMarkdown();
  editorInstance.destroy();
  createEditor(content);
}

/**
 * Re-creates the editor with the specified text.
 * @param newText - The text to load into the editor.
 */
export const updateEditorWithText = (newText: string): void => {
  if (editorInstance) {
    editorInstance.destroy();
  }
  createEditor(newText);
}

/**
 * Creates a viewer instance for displaying content.
 * @param viewerElem - The HTML element to mount the viewer.
 * @param text - The text to display in the viewer.
 */
export const createViewer = (viewerElem: HTMLElement, text: string): void => {
  const currentTheme = getCurrentTheme();
  Editor.factory({
    el: viewerElem,
    viewer: true,
    theme: currentTheme,
    initialValue: text,
    plugins: [colorSyntax, [codeSyntaxHighlight, { highlighter: Prism }], uml],
  });
};

export const copyMarkdownText = async (): Promise<void> => {
  const editor = getEditorInstance();
  if (!editor) return;
  const text = editor.getMarkdown();
  try {
    await navigator.clipboard.writeText(text);
    setClipboardIcon('check');
    console.log('Copied to clipboard successfully.');
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
}

/**
 * Ability to remove styles
 **/
export const clearEditorStyles = () => {
  if (!editorInstance) return;
  const html = editorInstance.getHTML();
  const cleaned = html.replace(/<[^>]*>/g, ''); // Remove all HTML tags
  editorInstance.setHTML(cleaned);
}

/**
 * Computes the editor height as 75% of the viewport height.
 */
const getEditorHeight = (): string => {
  return `${window.innerHeight * 0.75}px`;
}

window.addEventListener('resize', () => {
  const mountEl = document.querySelector<HTMLDivElement>('#editor');
  if (mountEl) {
    mountEl.style.height = getEditorHeight();
  }
});
