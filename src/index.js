import { createEditor, updateEditor, getEditorInstance, updateEditorWithText } from './services/editor.js';
import { getCurrentTheme, toggleStoredTheme, applyGlobalTheme } from './services/theme.js';
import {
  getAutoSaveSetting, setAutoSaveSetting, updateAutoSaveIcon,
  startAutoSave, stopAutoSave, setupAutoSaveOnUnload
} from './services/autoSave.js';
import { upsertText } from './services/save.js';
import { setupSearch } from './services/search.js';
import { initShortcuts } from './services/shortcut.js';
import { TextDB } from './db/TextDB.js';

// Keep a list of saved records to display in the side menu
let savedTexts = [];

/**
 * Escape strings to display in HTML
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// On initial load, retrieve the theme and apply it globally
const initialTheme = getCurrentTheme();
applyGlobalTheme(initialTheme);

// Initialize the editor with the current theme and dynamic height
createEditor();
updateCount();
initShortcuts();

// Initialize the TextDB (IndexedDB) instance and ensure DB setup
const textDB = new TextDB();
textDB.initDB();

// Auto-save setup: start or stop based on stored setting
if (getAutoSaveSetting()) {
  startAutoSave(textDB, getEditorInstance);
} else {
  stopAutoSave();
}
updateAutoSaveIcon(getAutoSaveSetting());
setupAutoSaveOnUnload(textDB, getEditorInstance);

// Set up the click event for the save button to save the text to IndexedDB
setupSearch(textDB);

// Check if the browser supports Service Workers
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(new URL('./sw.js', import.meta.url))
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

// Save button: Save the editor contents to IndexedDB
document.getElementById('save-btn').addEventListener('click', async() => {
  const editor = getEditorInstance();
  if (!editor) return;
  const text = editor.getMarkdown();
  try {
    await upsertText(textDB, text);
    console.log('Text saved successfully to IndexedDB.');
  } catch (error) {
    console.error('Failed to save text:', error);
  }
});

// Set up the click event for the theme toggle button in side menu
document.getElementById('toggle-theme').addEventListener('click', () => {
  const newTheme = toggleStoredTheme();
  applyGlobalTheme(newTheme);
  updateEditor();
  console.log(`Theme switched to: ${newTheme}`);
});

// Auto-save button: toggles auto-save ON/OFF
document.getElementById('auto-save-btn').addEventListener('click', () => {
  const current = getAutoSaveSetting();
  const newSetting = !current;
  setAutoSaveSetting(newSetting);
  updateAutoSaveIcon(newSetting);
  if (newSetting) {
    startAutoSave(textDB, getEditorInstance);
    console.log('AutoSave turned ON');
  } else {
    stopAutoSave();
    console.log('AutoSave turned OFF');
  }
});

// Menu button toggles the side menu (from right)
// Also update the saved texts list when the menu is shown
document.getElementById('menu-btn').addEventListener('click', async() => {
  const sideMenu = document.getElementById('side-menu');
  sideMenu.classList.toggle('translate-x-full');
  if (!sideMenu.classList.contains('translate-x-full')) {
    await updateSavedList();
  }
});

// Close button in side menu to hide the menu
document.getElementById('close-menu-btn').addEventListener('click', () => {
  const sideMenu = document.getElementById('side-menu');
  if (!sideMenu.classList.contains('translate-x-full')) {
    sideMenu.classList.add('translate-x-full');
  }
});

// Search button: shows search modal
document.getElementById('search-btn').addEventListener('click', () => {
  const searchModal = document.getElementById('search-modal');
  searchModal.classList.remove('hidden');
});

// Close search modal
document.getElementById('close-search-btn').addEventListener('click', () => {
  const searchModal = document.getElementById('search-modal');
  searchModal.classList.add('hidden');
});

// Listen for selection changes to update the character count display and reset clipboard icon
document.addEventListener('selectionchange', () => {
  updateCount();
  setClipboardIcon('default');
});

// Clipboard copy functionality
document.getElementById('clipboard-btn').addEventListener('click', async() => {
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
});

/**
 * Updates the character count display based on the WYSIWYG content (HTML),
 * ignoring Markdown syntax.
 * It shows both the total number of characters (rendered text only)
 * and the number of characters in the current selection.
 */
function updateCount() {
  const editor = getEditorInstance();
  if (!editor) return;
  const rawHtml = editor.getHTML();

  const doc = new DOMParser().parseFromString(rawHtml, 'text/html');
  const totalText = doc.body.textContent || '';

  const total = totalText.replace(/\n/g, '').length;

  const selectionText = window.getSelection().toString() || '';
  const selection = selectionText.replace(/\n/g, '').length;

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

/**
 * Updates the saved texts list in the side menu.
 * For each saved record, displays:
 * - Creation date (left)
 * - Truncated text content (first 5 lines; if more than 5 lines, adds "...")
 * - A "Display" button and a "Delete" button (right) that, when clicked, load or delete the saved text.
 * The list is generated using a template literal for improved readability.
 */
async function updateSavedList() {
  try {
    let texts = await textDB.selectAllTexts();
    texts.sort((a, b) => new Date(b.create_at) - new Date(a.create_at));
    savedTexts = texts;
    const sideMenuContent = document.getElementById('side-menu-content');
    sideMenuContent.innerHTML = texts.map(row => {
      const dateStr = new Date(row.create_at).toLocaleString();
      const lines = row.text.split('\n');
      let truncatedText = lines.slice(0, 5).join('\n');
      if (lines.length > 5) {
        truncatedText += '\n...';
      }
      return `
        <li data-id="${row.id}" class="bg-gray-50 dark:bg-gray-700 rounded p-3 shadow-sm">
          <div class="flex justify-between items-center mb-2 pb-1 border-b-2">
            <span class="text-sm text-gray-500 dark:text-gray-300">${escapeHTML(dateStr)}</span>
            <div class="flex space-x-2">
              <button class="bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-800 dark:hover:bg-cyan-700 text-cyan-700 dark:text-cyan-200 text-xs rounded px-2 py-1 display-btn">
                <span>Display</span>
              </button>
              <button class="bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-200 text-xs rounded px-2 py-1 delete-btn">
                <span>Delete</span>
              </button>
            </div>
          </div>
          <div class="text-md whitespace-pre-wrap">${escapeHTML(truncatedText)}</div>
        </li>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to retrieve saved texts:', err);
  }
}

const sideMenuContent = document.getElementById('side-menu-content');
sideMenuContent.addEventListener('click', async(event) => {
  const displayBtn = event.target.closest('.display-btn');
  const deleteBtn = event.target.closest('.delete-btn');
  if (displayBtn) {
    const li = displayBtn.closest('li');
    const recordId = li.getAttribute('data-id');
    const record = savedTexts.find(r => r.id == recordId);
    if (record) {
      const currentEditor = getEditorInstance();
      if (currentEditor) {
        const currentText = currentEditor.getMarkdown();
        if (currentText.trim().length > 0) {
          try {
            await upsertText(textDB, currentText);
            console.log('Current text saved before loading new one.');
          } catch (err) {
            console.error('Failed to save current text:', err);
          }
        }
      }
      updateEditorWithText(record.text);
      const sideMenu = document.getElementById('side-menu');
      if (!sideMenu.classList.contains('translate-x-full')) {
        sideMenu.classList.add('translate-x-full');
      }
    }
  } else if (deleteBtn) {
    const li = deleteBtn.closest('li');
    const recordId = li.getAttribute('data-id');
    try {
      await textDB.deleteById(recordId);
      console.log('Text record deleted successfully.');
      await updateSavedList();
    } catch (err) {
      console.error('Failed to delete text:', err);
    }
  }
});
