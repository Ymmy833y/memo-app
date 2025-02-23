const AUTO_SAVE_KEY = 'autoSaveEnabled';
const AUTO_SAVE_INTERVAL_KEY = 'autoSaveInterval';
let autoSaveInterval = null;

/**
 * Retrieves the auto-save setting from localStorage.
 * @returns {boolean} true if auto-save is enabled, false otherwise.
 */
export function getAutoSaveSetting() {
  return localStorage.getItem(AUTO_SAVE_KEY) === 'true';
}

/**
 * Sets the auto-save setting in localStorage.
 * @param {boolean} val - true for ON, false for OFF.
 */
export function setAutoSaveSetting(val) {
  localStorage.setItem(AUTO_SAVE_KEY, val);
}

/**
 * Retrieves the auto-save interval (in milliseconds) from localStorage.
 * If not set, returns the default value of 180000 (180 seconds).
 * @returns {number}
 */
export function getAutoSaveInterval() {
  const value = localStorage.getItem(AUTO_SAVE_INTERVAL_KEY);
  return value ? Number(value) : 180000;
}

/**
 * Sets the auto-save interval (in milliseconds) in localStorage.
 * @param {number} interval - The interval in milliseconds.
 */
export function setAutoSaveInterval(interval) {
  localStorage.setItem(AUTO_SAVE_INTERVAL_KEY, interval);
}

/**
 * Updates the auto-save button icon based on the enabled state.
 * If enabled, the icon's fill color is set to green and the symbol is changed to '#checked';
 * if disabled, the fill color is set to red and the symbol is changed to '#unChecked'.
 * @param {boolean} enabled
 */
export function updateAutoSaveIcon(enabled) {
  const autoSaveBtn = document.getElementById('auto-save-btn');
  if (!autoSaveBtn) return;
  const svgElement = autoSaveBtn.querySelector('svg');
  const useElem = svgElement.querySelector('use');
  if (enabled) {
    svgElement.setAttribute('fill', '#22c55e'); // green
    useElem.setAttribute('xlink:href', '#checked');
  } else {
    svgElement.setAttribute('fill', '#ef4444'); // red
    useElem.setAttribute('xlink:href', '#unChecked');
  }
}

/**
 * Performs the auto-save: retrieves the current editor text and,
 * if non-empty, checks for an identical record in IndexedDB.
 * If a duplicate exists, updates its create_at timestamp;
 * otherwise, saves a new record.
 * @param {object} textDB - The TextDB instance.
 * @param {Function} getEditorInstance - Function to get the current editor instance.
 */
export async function performAutoSave(textDB, getEditorInstance) {
  const editor = getEditorInstance();
  if (!editor) return;
  const currentText = editor.getMarkdown();
  if (currentText.trim().length === 0) return;
  try {
    const allRecords = await textDB.getAllTexts();
    // Find an existing record with exactly the same text
    const duplicate = allRecords.find(record => record.text === currentText);
    if (duplicate) {
      duplicate.create_at = new Date().toISOString();
      await textDB.updateText(duplicate);
      console.log("AutoSave: Duplicate record updated.");
    } else {
      await textDB.saveText(currentText);
      console.log("AutoSave: New record saved.");
    }
  } catch (err) {
    console.error("AutoSave failed:", err);
  }
}

/**
 * Starts the auto-save timer using the interval value stored in localStorage.
 * @param {object} textDB - The TextDB instance.
 * @param {Function} getEditorInstance - Function to get the current editor instance.
 */
export function startAutoSave(textDB, getEditorInstance) {
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  const interval = getAutoSaveInterval();
  autoSaveInterval = setInterval(() => {
    performAutoSave(textDB, getEditorInstance);
  }, interval);
}

/**
 * Stops the auto-save timer.
 */
export function stopAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
}

/**
 * Sets up auto-save on page unload (best-effort).
 * @param {object} textDB - The TextDB instance.
 * @param {Function} getEditorInstance - Function to get the current editor instance.
 */
export function setupAutoSaveOnUnload(textDB, getEditorInstance) {
  window.addEventListener('beforeunload', () => {
    if (getAutoSaveSetting()) {
      performAutoSave(textDB, getEditorInstance);
    }
  });
}
