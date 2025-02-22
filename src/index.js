import { createEditor, updateEditor, getEditorInstance } from './editor.js';
import { getCurrentTheme, toggleStoredTheme, applyGlobalTheme } from './utils/theme.js';

// On initial load, get the theme from storage or browser settings and apply it globally
const initialTheme = getCurrentTheme();
applyGlobalTheme(initialTheme);

// Initialize the editor with the current theme and dynamic height
createEditor();
updateCount();

// Set up the click event for the theme toggle button
document.getElementById('toggle-theme').addEventListener('click', () => {
  const newTheme = toggleStoredTheme();
  applyGlobalTheme(newTheme);
  updateEditor();
  console.log(`Theme switched to: ${newTheme}`);
});

// Listen for window resize events and update the editor's height accordingly
window.addEventListener('resize', () => {
  updateEditor();
});

// Listen for selection changes to update the count for selected text
document.addEventListener('selectionchange', updateCount);

/**
 * Updates the character count display.
 * It shows both the total number of characters in the editor and the number of characters in the current selection.
 */
function updateCount() {
  const editor = getEditorInstance();
  if (!editor) return;

  // Remove newline characters and unescaped <br> tags.
  // The regex (?<!\\)<br> matches <br> that is NOT preceded by a backslash.
  const total = editor.getMarkdown()
    .replace(/\n/g, '')
    .replace(/(?<!\\)<br>/g, '')
    .length;
  const selection = window.getSelection().toString()
    .replace(/\n/g, '')
    .replace(/(?<!\\)<br>/g, '')
    .length;
  const countElem = document.getElementById('count');
  countElem.innerText = `Total Characters: ${total}, Selected Characters: ${selection}`;
}
