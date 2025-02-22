import Editor from '@toast-ui/editor';
import { getCurrentTheme } from './utils/theme.js';

let editorInstance = null;

/**
 * Computes the editor height as 80% of the viewport height.
 * @returns {string} The height in pixels (e.g., "600px").
 */
function getEditorHeight() {
  return `${window.innerHeight * 0.8}px`;
}

/**
 * Initializes the editor.
 * @param {string} [initialValue=''] - The initial content for the editor.
 * @returns {Editor} The created editor instance.
 */
export function createEditor(initialValue = '') {
  const currentTheme = getCurrentTheme();
  const height = getEditorHeight();
  editorInstance = new Editor({
    el: document.querySelector('#editor'),
    height: height,
    initialEditType: 'wysiwyg',
    previewStyle: 'vertical',
    theme: currentTheme,
    initialValue,
  });
  return editorInstance;
}

/**
 * Re-creates the editor while preserving its content.
 * This function applies the current theme and updated height.
 */
export function updateEditor() {
  if (!editorInstance) return;
  const content = editorInstance.getMarkdown();
  editorInstance.destroy();
  const currentTheme = getCurrentTheme();
  const height = getEditorHeight();
  editorInstance = new Editor({
    el: document.querySelector('#editor'),
    height: height,
    initialEditType: 'wysiwyg',
    previewStyle: 'vertical',
    theme: currentTheme,
    initialValue: content,
  });
}
