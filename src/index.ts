import { saveMemo } from './service/memo';
import { initDatabase } from './db';
import { copyMarkdownText, createEditor, updateEditor } from './service/editor';
import { applyGlobalTheme, toggleTheme } from './service/theme';
import { initializeAutoSave, toggleAutoSave, changeAutoSaveInterval } from './service/autoSave';
import { renderAllMemos } from './service/allMemos';
import { renderMemoSearch } from './service/memoSearch';
import { initializeShortcuts } from './service/shortcut';

const main = () => {
  // On initial load, retrieve the theme and apply it globally
  applyGlobalTheme();
  // Initialize the editor with the current theme and dynamic height
  createEditor();
  // Initialize auto save functionality
  initializeAutoSave();
  // Initialize keyboard shortcuts
  initializeShortcuts();

  // Check if the browser supports Service Workers
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(new URL('./sw.ts', import.meta.url))
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }

  // Clipboard copy functionality
  const clipboardBtn = document.getElementById('clipboard-btn') as HTMLButtonElement;
  clipboardBtn.addEventListener('click', async() => {
    await copyMarkdownText();
  });

  // Save button: Save the editor contents to IndexedDB
  const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
  saveBtn.addEventListener('click', async() => {
    try {
      await saveMemo();
      console.log('Text saved successfully to IndexedDB.');
    } catch (error) {
      console.error('Failed to save text:', error);
    }
  });

  // Menu button toggles the side menu (from right)
  // Also update the saved texts list when the menu is shown
  const menuBtn = document.getElementById('menu-btn') as HTMLButtonElement;
  menuBtn.addEventListener('click', () => {
    const sideMenu = document.getElementById('side-menu') as HTMLDivElement;
    sideMenu.classList.toggle('translate-x-full');
    if (!sideMenu.classList.contains('translate-x-full')) {
      renderAllMemos();
    }
  });

  // Close button in side menu to hide the menu
  const closeMenuBtn = document.getElementById('close-menu-btn') as HTMLButtonElement;
  closeMenuBtn.addEventListener('click', () => {
    hideSideMenu();
  });

  // Search button: shows search modal
  const searchBtn = document.getElementById('search-btn') as HTMLButtonElement;
  searchBtn.addEventListener('click', () => {
    const searchModal = document.getElementById('search-modal') as HTMLDivElement;
    searchModal.classList.remove('hidden');
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  });

  // Close search modal
  const closeSearchBtn = document.getElementById('close-search-btn') as HTMLButtonElement;
  closeSearchBtn.addEventListener('click', () => {
    hideSearchModal();
  });

  // Set up the click event for the theme toggle button in side menu
  const toggleThemeBtn = document.getElementById('toggle-theme') as HTMLButtonElement;
  toggleThemeBtn.addEventListener('click', () => {
    const newTheme = toggleTheme();
    applyGlobalTheme(newTheme);
    updateEditor();
    console.log(`Theme switched to: ${newTheme}`);
  });

  // Set up the click event for the auto-save button
  const autoSaveBtn = document.getElementById('auto-save-btn') as HTMLButtonElement;
  autoSaveBtn.addEventListener('click', () => {
    toggleAutoSave();
  });
  // Set up the change event for the auto-save interval dropdown
  const autoSaveInterval = document.getElementById('auto-save-interval') as HTMLSelectElement;
  autoSaveInterval.addEventListener('change', changeAutoSaveInterval);

  // String search event handling
  const searchKeyword = document.getElementById('search-keyword') as HTMLInputElement;
  const searchCaseSensitiveBtn = document.getElementById('search-case-sensitive') as HTMLInputElement;
  searchKeyword.addEventListener('input', () => {
    renderMemoSearch(searchKeyword.value, searchCaseSensitiveBtn.checked);
  });
  searchCaseSensitiveBtn.addEventListener('click', () => {
    const searchCaseSensitiveLabel = searchCaseSensitiveBtn.parentElement as HTMLLabelElement;
    searchCaseSensitiveLabel.classList.toggle('bg-blue-300', searchCaseSensitiveBtn.checked);
    searchCaseSensitiveLabel.classList.toggle('dark:bg-blue-500', searchCaseSensitiveBtn.checked);
    renderMemoSearch(searchKeyword.value, searchCaseSensitiveBtn.checked);
  });

  // Listen for selection changes to update the character count display and reset clipboard icon
  document.addEventListener('selectionchange', () => {
    setClipboardIcon('default');
    setSaveIcon('default');
  });
};

/**
 * Sets the clipboard button icon.
 * @param {string} state - 'default' for the copy icon or 'check' for the complete icon.
 */
export const setClipboardIcon = (state: string) => {
  const clipboardBtn = document.getElementById('clipboard-btn') as HTMLButtonElement;
  const svgUse = clipboardBtn.querySelector('svg use') as SVGUseElement;
  if (state === 'check') {
    svgUse.setAttribute('href', '#clipboard_check');
  } else {
    svgUse.setAttribute('href', '#clipboard_default');
  }
}

/**
 * Sets the save button icon.
 * @param state - 'check' for the check icon or 'default' for the default icon.
 */
export const setSaveIcon = (state: string) => {
  const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
  const svgUse = saveBtn.querySelector('svg use') as SVGUseElement;
  if (state === 'check') {
    svgUse.setAttribute('href', '#save_check');
  } else {
    svgUse.setAttribute('href', '#save_default');
  }
}

/**
 * Hides the side menu by adding the 'translate-x-full' class.
 */
export const hideSideMenu = () => {
  const sideMenu = document.getElementById('side-menu') as HTMLDivElement;
  if (!sideMenu.classList.contains('translate-x-full')) {
    sideMenu.classList.add('translate-x-full');
  }
}

/**
 * Hides the search modal by adding the 'hidden' class.
 */
export const hideSearchModal = () => {
  const searchModal = document.getElementById('search-modal') as HTMLDivElement;
  searchModal.classList.add('hidden');
}

initDatabase().then(() => {
  console.log('Database initialized successfully.');
  main();
}).catch((error) => {
  console.error('Error initializing database:', error);
});
