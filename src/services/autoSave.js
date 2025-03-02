import { textDBInstance } from '../db/TextDB';
import { getEditorInstance } from './editor';

const AUTO_SAVE_KEY = 'autoSaveEnabled';
const AUTO_SAVE_INTERVAL_KEY = 'autoSaveInterval';
let autoSaveInterval = null;

/**
 * Retrieves the auto-save setting from localStorage.
 * @returns {boolean} true if auto-save is enabled, false otherwise.
 */
function getAutoSaveSetting() {
  return localStorage.getItem(AUTO_SAVE_KEY) === 'true';
}

/**
 * Sets the auto-save setting in localStorage.
 * @param {boolean} val - true for ON, false for OFF.
 */
function setAutoSaveSetting(val) {
  localStorage.setItem(AUTO_SAVE_KEY, val);
}

/**
 * Retrieves the auto-save interval (in milliseconds) from localStorage.
 * If not set, returns the default value of 180000 (180 seconds).
 * @returns {number}
 */
function getAutoSaveInterval() {
  const value = localStorage.getItem(AUTO_SAVE_INTERVAL_KEY);
  const num = Number(value);
  if (value !== null && !isNaN(num) && num > 0) {
    return num;
  } else {
    setAutoSaveInterval(180000);
    return 180000;
  }
}

/**
 * Sets the auto-save interval (in milliseconds) in localStorage.
 * @param {number} interval - The interval in milliseconds.
 */
function setAutoSaveInterval(interval) {
  localStorage.setItem(AUTO_SAVE_INTERVAL_KEY, interval);
}

/**
 * Updates the auto-save button icon based on the enabled state.
 * @param {boolean} enabled
 */
function updateAutoSaveIcon(enabled) {
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
 * Gets the text in the editor and uses upsertText to validate duplicates before saving.
 */
export async function autoSaveText() {
  const editor = getEditorInstance();
  if (!editor) return;
  const currentText = editor.getMarkdown();
  if (currentText.trim().length === 0) return;
  try {
    await textDBInstance.upsertText(currentText);
  } catch (err) {
    console.error('AutoSave failed:', err);
  }
}

/**
 * Starts the auto-save timer using the interval value stored in localStorage.
 */
function startAutoSave() {
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  const interval = getAutoSaveInterval();
  autoSaveInterval = setInterval(() => {
    autoSaveText();
  }, interval);
}

/**
 * Stops the auto-save timer.
 */
function stopAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
}

/**
 * Sets up auto-save on page unload
 */
function setupAutoSaveOnUnload() {
  window.addEventListener('beforeunload', () => {
    autoSaveText();
  });
}

/**
 * Consolidated function for initializing auto-save UI and events:
 * - Sets initial auto-save state and interval.
 * - Registers event for toggling auto-save on/off.
 * - Registers event for updating auto-save interval via select tag.
 * - Disables the interval select when auto-save is off.
 */
export function setupAutoSaveUI() {
  const autoSaveEnabled = getAutoSaveSetting();

  // Set initial auto-save state based on localStorage
  if (autoSaveEnabled) {
    startAutoSave();
  } else {
    stopAutoSave();
  }
  updateAutoSaveIcon(autoSaveEnabled);
  setupAutoSaveOnUnload();

  // Get the select element for auto-save interval and set its initial state
  const intervalSelect = document.getElementById('auto-save-interval');
  if (intervalSelect) {
    // If auto-save is OFF at initial render, disable the select element
    intervalSelect.disabled = !autoSaveEnabled;
    // Set initial value based on localStorage (convert milliseconds to seconds)
    const currentIntervalSec = getAutoSaveInterval() / 1000;
    intervalSelect.value = currentIntervalSec.toString();

    // Update the interval on change
    intervalSelect.addEventListener('change', (event) => {
      const newValue = Number(event.target.value); // in seconds
      const newIntervalMs = newValue * 1000; // convert to milliseconds
      setAutoSaveInterval(newIntervalMs);
      startAutoSave(); // restart timer with new interval
      console.log(`AutoSave interval updated to ${newValue} seconds.`);
    });
  }

  // Register click event for the auto-save button to toggle auto-save on/off
  const autoSaveBtn = document.getElementById('auto-save-btn');
  if (autoSaveBtn) {
    autoSaveBtn.addEventListener('click', () => {
      const current = getAutoSaveSetting();
      const newSetting = !current;
      setAutoSaveSetting(newSetting);
      updateAutoSaveIcon(newSetting);
      if (newSetting) {
        startAutoSave();
        console.log('AutoSave turned ON');
      } else {
        stopAutoSave();
        console.log('AutoSave turned OFF');
      }
      // Update the disabled state of the interval select accordingly
      if (intervalSelect) {
        intervalSelect.disabled = !newSetting;
      }
    });
  }
}
