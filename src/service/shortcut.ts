import { getEditorInstance, clearEditorStyles, copyMarkdownText } from './editor.js';
import { saveMemo } from './memo.js';

const localStorageKey = 'shortcuts';

const defaultShortcuts = {
  header1: 'Ctrl+Alt+1',
  header2: 'Ctrl+Alt+2',
  header3: 'Ctrl+Alt+3',
  header4: 'Ctrl+Alt+4',
  header5: 'Ctrl+Alt+5',
  header6: 'Ctrl+Alt+6',
  paragraph: 'Ctrl+Alt+0',
  bold: 'Ctrl+B',
  italic: 'Ctrl+I',
  strike: 'Ctrl+S',
  quote: 'Ctrl+Shift+Q',
  bulletList: 'Ctrl+U',
  orderedList: 'Ctrl+O',
  taskList: 'Ctrl+Alt+T',
  inlineCode: 'Ctrl+Shift+C',
  codeBlock: 'Ctrl+Shift+Alt+C',
  horizontalRule: 'Ctrl+L',
  saveText: 'Ctrl+Shift+S',
  showSearchModal: 'Ctrl+Shift+F',
  copy: 'Ctrl+Alt+C',
  clearStyle: 'Ctrl+Alt+X',
};

/**
 * Mapping of commands to their corresponding functions.
 * Assumes that the TUI Editor instance has an exec() method.
 */
const commandMapping: Record<string, () => void> = {
  header1: () => {
    const editor = getEditorInstance();
    if (editor) {
      editor.exec('heading', { level: 1 });
    }
  },
  header2: () => {
    const editor = getEditorInstance();
    if (editor) {
      editor.exec('heading', { level: 2 });
    }
  },
  header3: () => {
    const editor = getEditorInstance();
    if (editor) {
      editor.exec('heading', { level: 3 });
    }
  },
  header4: () => {
    const editor = getEditorInstance();
    if (editor) {
      editor.exec('heading', { level: 4 });
    }
  },
  header5: () => {
    const editor = getEditorInstance();
    if (editor) {
      editor.exec('heading', { level: 5 });
    }
  },
  header6: () => {
    const editor = getEditorInstance();
    if (editor) {
      editor.exec('heading', { level: 6 });
    }
  },
  paragraph: () => {
    const editor = getEditorInstance();
    if (editor) {
      editor.exec('heading', { level: 0 });
    }
  },
  bold: () => {
    const editor = getEditorInstance();
    if (editor) {
      editor.exec('bold');
    }
  },
  italic: () => {
    const editor = getEditorInstance();
    if (editor) {
      editor.exec('italic');
    }
  },
  strike: () => {
    const editor = getEditorInstance();
    if (editor) {
      editor.exec('strike');
    }
  },
  quote: () => {
    const editor = getEditorInstance();
    if (editor) {
      editor.exec('blockQuote');
    }
  },
  bulletList: () => {
    const editor = getEditorInstance();
    if (editor) {
      editor.exec('bulletList');
    }
  },
  orderedList: () => {
    const editor = getEditorInstance();
    if (editor) {
      editor.exec('orderedList');
    }
  },
  taskList: () => {
    const editor = getEditorInstance();
    if (editor) {
      editor.exec('taskList');
    }
  },
  inlineCode: () => {
    const editor = getEditorInstance();
    if (editor) {
      editor.exec('code');
    }
  },
  codeBlock: () => {
    const editor = getEditorInstance();
    if (editor) {
      editor.exec('codeBlock');
    }
  },
  horizontalRule: () => {
    const editor = getEditorInstance();
    if (editor) {
      editor.exec('hr');
    }
  },
  clearStyle: () => {
    clearEditorStyles();
  },

  saveText: () => {
    saveMemo();
  },
  showSearchModal: () => {
    const searchModal = document.getElementById('search-modal') as HTMLDivElement;
    searchModal.classList.remove('hidden');
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    searchInput.focus();
  },
  copy: async() => {
    await copyMarkdownText();
  }
};

/**
 * Loads shortcut settings from local storage.
 * If no settings are found, save the default settings and return them.
 *
 * @returns The loaded shortcut settings.
 */
const loadShortcuts = (): Record<string, string> => {
  const stored = localStorage.getItem(localStorageKey);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Merge stored settings with default settings.
      return { ...defaultShortcuts, ...parsed };
    } catch (e) {
      console.error('Failed to load shortcut settings from local storage. Using default settings.', e);
    }
  }
  // Save default settings to localStorage if not found.
  saveShortcuts(defaultShortcuts);
  return defaultShortcuts;
}

/**
 * Saves the shortcut settings to local storage.
 *
 * @param shortcuts - The shortcut settings to save.
 */
const saveShortcuts = (shortcuts: Record<string, string>) => {
  localStorage.setItem(localStorageKey, JSON.stringify(shortcuts));
}


/**
 * Parses a shortcut string (e.g., "Ctrl+Shift+C") and converts it into an object.
 *
 * @param shortcut - The shortcut string to parse.
 * @returns An object with boolean properties for ctrl, shift, alt, and the key.
 */
function parseShortcut(shortcut: string): { ctrl: boolean, shift: boolean, alt: boolean, key: string | undefined } {
  const parts = shortcut.split('+').map(part => part.trim().toLowerCase());
  return {
    ctrl: parts.includes('ctrl'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    // Retrieve the part that is not 'ctrl', 'shift', or 'alt' as the key.
    key: parts.find(p => !['ctrl', 'shift', 'alt'].includes(p))
  };
}

/**
 * Determines whether a keyboard event matches the specified shortcut.
 *
 * @param event - The keyboard event to check.
 * @param shortcutStr - The shortcut string to match against.
 * @returns Whether the event matches the shortcut.
 */
const isMatchingEvent = (event: KeyboardEvent, shortcutStr: string): boolean => {
  const parsed = parseShortcut(shortcutStr);
  if (parsed.ctrl !== event.ctrlKey) return false;
  if (parsed.shift !== event.shiftKey) return false;
  if (parsed.alt !== event.altKey) return false;
  if (parsed.key && parsed.key.toLowerCase() !== event.key.toLowerCase()) return false;
  return true;
}

/**
 * Keyboard event handler.
 */
const handleKeyDown = (event: KeyboardEvent) => {
  const shortcuts = loadShortcuts();
  for (const command in shortcuts) {
    const shortcutStr = shortcuts[command];
    if (isMatchingEvent(event, shortcutStr)) {
      event.preventDefault();
      if (commandMapping[command]) {
        commandMapping[command]();
      }
      return;
    }
  }
}

/**
 * Initializes the shortcut functionality.
 * Calling this function registers a keydown event handler on the document.
 */
export const initializeShortcuts = () => {
  document.addEventListener('keydown', handleKeyDown, true);
}
