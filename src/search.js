import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer.js';
import { getCurrentTheme } from './utils/theme.js';
import { updateEditorWithText, getEditorInstance } from './editor.js';

/**
 * Extracts a snippet from the given text based on the query.
 * The snippet shows from 5 characters before the first match to the next newline or the end.
 * If the match is at the beginning, returns from the start.
 * @param {string} text - The full text.
 * @param {string} query - The search query.
 * @param {boolean} caseSensitive - Whether the search is case sensitive.
 * @returns {string} The extracted snippet.
 */
export function extractSnippet(text, query, caseSensitive) {
  let idx;
  if (caseSensitive) {
    idx = text.indexOf(query);
  } else {
    idx = text.toLowerCase().indexOf(query.toLowerCase());
  }
  if (idx === -1) return "";
  const start = Math.max(0, idx - 5);
  const endIdx = text.indexOf("\n", idx);
  const end = endIdx === -1 ? text.length : endIdx;
  return text.substring(start, end).trim();
}

/**
 * Sets up search functionality in the search modal.
 * @param {object} textDB - The TextDB instance.
 */
export function setupSearch(textDB) {
  const searchInput = document.getElementById('search-input');
  const toggleCaseBtn = document.getElementById('toggle-case-btn');
  const resultsContainer = document.getElementById('search-results');
  const previewContainer = document.getElementById('search-preview');
  let caseSensitive = false;

  toggleCaseBtn.addEventListener('click', () => {
    caseSensitive = !caseSensitive;
    toggleCaseBtn.classList.toggle('bg-blue-100', caseSensitive);
    toggleCaseBtn.classList.toggle('bg-red-100', !caseSensitive);
    performSearch();
  });

  searchInput.addEventListener('input', performSearch);

  async function performSearch() {
    const query = searchInput.value;
    resultsContainer.innerHTML = '';
    toggleSearchPreview(false);
    if (!query) return;
    try {
      const allTexts = await textDB.getAllTexts();
      const filtered = allTexts.filter(record => {
        if (caseSensitive) {
          return record.text.includes(query);
        } else {
          return record.text.toLowerCase().includes(query.toLowerCase());
        }
      });

      filtered.forEach(record => {
        const snippet = extractSnippet(record.text, query, caseSensitive);
        const item = document.createElement('button');
        item.classList.add("py-2", "px-2", "text-left", "hover:bg-gray-200", "dark:hover:bg-gray-700", "rounded");
        item.innerText = snippet;
        item.addEventListener('click', () => showSearchPreview(record));
        resultsContainer.appendChild(item);
      });
    } catch (error) {
      console.error("Search error:", error);
    }
  }

  function showSearchPreview(record) {
    const preview = document.getElementById('preview');
    preview.innerHTML = '';
    const theme = getCurrentTheme();
    new Viewer({
      el: preview,
      theme: theme,
      initialValue: record.text,
    });
    // The Display button is already in the HTML (inside search-preview header)
    const displayBtn = document.getElementById('preview-display-btn');
    displayBtn.onclick = async () => {
      // Save current editor content only if non-empty
      const currentEditor = getEditorInstance();
      if (currentEditor) {
        const currentText = currentEditor.getMarkdown();
        if (currentText.trim().length > 0) {
          try {
            await textDB.saveText(currentText);
            console.log("Current text saved before loading search result.");
          } catch (err) {
            console.error("Failed to save current text:", err);
          }
        }
      }
      updateEditorWithText(record.text);
      // Close the search modal and side menu
      document.getElementById('search-modal').classList.add('hidden');
      const sideMenu = document.getElementById('side-menu');
      if (!sideMenu.classList.contains('translate-x-full')) {
        sideMenu.classList.add('translate-x-full');
      }
    };
    toggleSearchPreview(true);
  }

  function toggleSearchPreview(show) {
    if (show) {
      resultsContainer.classList.remove('w-full');
      resultsContainer.classList.add('w-1/2');
      previewContainer.classList.remove('hidden');
    } else {
      resultsContainer.classList.add('w-full');
      resultsContainer.classList.remove('w-1/2');
      previewContainer.classList.add('hidden');
    }
  }
}
