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
document.addEventListener('selectionchange', () => {
  updateCount();
  setClipboardIcon('default');
});

// Set up the click event for the clipboard button
document.getElementById('clipboard-btn').addEventListener('click', async () => {
  const editor = getEditorInstance();
  if (!editor) return;
  const text = editor.getMarkdown();
  try {
    await navigator.clipboard.writeText(text);
    // If successful, change the clipboard button icon to the "check" icon
    setClipboardIcon('check');
    console.log('Copied to clipboard successfully.');
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
});

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

/**
 * Sets the clipboard button icon.
 * @param {string} state - 'default' for the copy icon or 'check' for the complete icon.
 */
function setClipboardIcon(state) {
  const clipboardBtn = document.getElementById('clipboard-btn');
  const svgUse = clipboardBtn.querySelector('svg use');
  if (state === 'check') {
    svgUse.setAttribute('xlink:href', '#clipboard_check');
  } else {
    svgUse.setAttribute('xlink:href', '#clipboard_default');
  }
}
