import { createEditor, updateEditor, getEditorInstance } from './editor.js';
import { getCurrentTheme, toggleStoredTheme, applyGlobalTheme } from './utils/theme.js';
import { 
  getAutoSaveSetting, setAutoSaveSetting, updateAutoSaveIcon, 
  startAutoSave, stopAutoSave, setupAutoSaveOnUnload 
} from './utils/autoSave.js';
import { TextDB } from './db/TextDB.js';

// On initial load, retrieve the theme and apply it globally
const initialTheme = getCurrentTheme();
applyGlobalTheme(initialTheme);

// Initialize the editor with the current theme and dynamic height
createEditor();
updateCount();

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
document.getElementById('save-btn').addEventListener('click', async () => {
  const editor = getEditorInstance();
  if (!editor) return;
  const text = editor.getMarkdown();
  try {
    await textDB.saveText(text);
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
    console.log("AutoSave turned ON");
  } else {
    stopAutoSave();
    console.log("AutoSave turned OFF");
  }
});

// Menu button toggles the side menu (from right)
// Also update the saved texts list when the menu is shown
document.getElementById('menu-btn').addEventListener('click', async () => {
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

// Listen for window resize events and update the editor's height accordingly
window.addEventListener('resize', () => {
  updateEditor();
  updateCount();
});

// Listen for selection changes to update the character count display and reset clipboard icon
document.addEventListener('selectionchange', () => {
  updateCount();
  setClipboardIcon('default');
});

// Clipboard copy functionality
document.getElementById('clipboard-btn').addEventListener('click', async () => {
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
 * Updates the character count display.
 * It shows both the total number of characters (excluding newline and unescaped <br> tags)
 * and the number of characters in the current selection.
 */
function updateCount() {
  const editor = getEditorInstance();
  if (!editor) return;
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

/**
 * Updates the saved texts list in the side menu.
 * For each saved record, displays:
 * - Creation date (left)
 * - Truncated text content (first 5 lines; if more than 5 lines, adds "...")
 * - A "Display" button and a "Delete" button (right) that, when clicked, load or delete the saved text.
 */
async function updateSavedList() {
  try {
    let texts = await textDB.getAllTexts();
    // Sort texts by creation date descending
    texts.sort((a, b) => new Date(b.create_at) - new Date(a.create_at));

    const sideMenuContent = document.getElementById('side-menu-content');
    sideMenuContent.innerHTML = texts.map(row => {
      const dateStr = new Date(row.create_at).toLocaleString();
      const lines = row.text.split("\n");
      let truncatedText = lines.slice(0, 5).join("\n");
      if (lines.length > 5) {
        truncatedText += "\n...";
      }
      return `
        <li class="bg-gray-50 dark:bg-gray-700 rounded p-3 shadow-sm">
          <div class="flex justify-between items-center mb-2 pb-1 border-b-2">
            <span class="text-sm text-gray-500 dark:text-gray-300">${dateStr}</span>
            <div class="flex space-x-2">
              <button class="bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-800 dark:hover:bg-cyan-700 text-cyan-700 dark:text-cyan-200 text-xs rounded px-2 py-1 display-btn">
                <span>Display</span>
              </button>
              <button class="bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-200 text-xs rounded px-2 py-1 delete-btn">
                <span>Delete</span>
              </button>
            </div>
          </div>
          <div class="text-md whitespace-pre-wrap">${truncatedText}</div>
        </li>
      `;
    }).join("");

    // Attach click event listeners to all "Display" buttons
    const displayButtons = sideMenuContent.querySelectorAll('.display-btn');
    displayButtons.forEach((btn, index) => {
      btn.addEventListener('click', async () => {
        const row = texts[index];
        // Save current editor content only if non-empty
        const currentEditor = getEditorInstance();
        if (currentEditor) {
          const currentText = currentEditor.getMarkdown();
          if (currentText.trim().length > 0) {
            try {
              await textDB.saveText(currentText);
              console.log("Current text saved before loading new one.");
            } catch (err) {
              console.error("Failed to save current text:", err);
            }
          }
        }
        // Load the selected saved text into the editor.
        updateEditorWithText(row.text);
        // Close the side menu.
        const sideMenu = document.getElementById('side-menu');
        if (!sideMenu.classList.contains('translate-x-full')) {
          sideMenu.classList.add('translate-x-full');
        }
      });
    });

    // Attach click event listeners to all "Delete" buttons
    const deleteButtons = sideMenuContent.querySelectorAll('.delete-btn');
    deleteButtons.forEach((btn, index) => {
      btn.addEventListener('click', async () => {
        const row = texts[index];
        try {
          await textDB.deleteById(row.id);
          console.log("Text record deleted successfully.");
          // Remove the corresponding list item from the DOM
          btn.closest('li').remove();
        } catch (err) {
          console.error("Failed to delete text:", err);
        }
      });
    });
  } catch (err) {
    console.error("Failed to retrieve saved texts:", err);
  }
}

/**
 * Re-creates the editor with the specified text.
 * @param {string} newText - The text to load into the editor.
 */
function updateEditorWithText(newText) {
  const editor = getEditorInstance();
  if (editor) {
    editor.destroy();
  }
  createEditor(newText);
}
