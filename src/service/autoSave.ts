import { saveMemo } from './memo';

const AUTO_SAVE_ENABLED_KEY = 'autoSaveEnabled';
const AUTO_SAVE_INTERVAL_KEY = 'autoSaveInterval';

let autoSaveInterval: NodeJS.Timeout | null = null;

/**
 * Retrieves the auto save enabled setting from localStorage.
 * @returns {boolean} true if auto-save is enabled, false otherwise.
 */
const getAutoSaveEnabled = () => {
  return localStorage.getItem(AUTO_SAVE_ENABLED_KEY) === 'true';
}

/**
 * Sets the auto save enabled setting in localStorage.
 * @param {boolean} enabled - true to enable auto-save, false to disable it.
 */
const setAutoSaveEnabled = (enabled: boolean) => {
  localStorage.setItem(AUTO_SAVE_ENABLED_KEY, enabled.toString());
}

/**
 * Sets the auto save interval (in milliseconds) in localStorage.
 * @param {number} interval - The interval in milliseconds.
 */
const setAutoSaveInterval = (interval: number) => {
  localStorage.setItem(AUTO_SAVE_INTERVAL_KEY, interval.toString());
}

/**
 * Retrieves the auto save interval (in milliseconds) from localStorage.
 * If not set, returns the default value of 180000 (180 seconds).
 * @returns {number}
 */
const getAutoSaveInterval = () => {
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
 * Updates the auto-save button icon based on the enabled state.
 * @param {boolean} enabled
 */
const updateAutoSaveIcon = (enabled: boolean) => {
  const autoSaveBtn = document.getElementById('auto-save-btn') as HTMLButtonElement;
  const autoSaveIntervalSelect = document.getElementById('auto-save-interval') as HTMLSelectElement;

  const svgElement = autoSaveBtn.querySelector('svg') as SVGElement;
  const useElem = svgElement.querySelector('use') as SVGUseElement;
  if (enabled) {
    svgElement.setAttribute('fill', '#22c55e'); // green
    useElem.setAttribute('xlink:href', '#checked');
    autoSaveIntervalSelect.disabled = false;
  } else {
    svgElement.setAttribute('fill', '#ef4444'); // red
    useElem.setAttribute('xlink:href', '#unChecked');
    autoSaveIntervalSelect.disabled = true;
  }
}

/**
 * Sets the auto-save interval based on the selected value from the dropdown.
 * @param {number} interval - The selected interval value from the dropdown.
 */
const updateAutoSaveIntervalDropdown = (interval: number) => {
  const autoSaveIntervalSelect = document.getElementById('auto-save-interval') as HTMLSelectElement;
  autoSaveIntervalSelect.value = interval.toString();
}

/**
 * Starts the auto-save timer using the interval value stored in localStorage.
 */
const startAutoSave = () => {
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  const interval = getAutoSaveInterval();
  autoSaveInterval = setInterval(() => {
    saveMemo();
  }, interval);
  setAutoSaveEnabled(true);
  updateAutoSaveIcon(true);
}

/**
 * Stops the auto-save timer.
 */
const stopAutoSave = () => {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
  setAutoSaveEnabled(false);
  updateAutoSaveIcon(false);
}

export const initializeAutoSave = () => {
  const autoSaveEnabled = getAutoSaveEnabled();
  const autoSaveIntervalValue = getAutoSaveInterval();
  updateAutoSaveIcon(autoSaveEnabled);
  updateAutoSaveIntervalDropdown(autoSaveIntervalValue);

  if (autoSaveEnabled) {
    startAutoSave();
  } else {
    stopAutoSave();
  }

  window.addEventListener('beforeunload', () => {
    if (getAutoSaveEnabled()) {
      saveMemo();
    }
  });
}

export const toggleAutoSave = () => {
  const autoSaveEnabled = getAutoSaveEnabled();
  if (autoSaveEnabled) {
    stopAutoSave();
  } else {
    startAutoSave();
  }
}

export const changeAutoSaveInterval = (event: Event) => {
  const interval = Number((event.target as HTMLSelectElement).value);
  updateAutoSaveIntervalDropdown(interval);
  setAutoSaveInterval(interval);
  startAutoSave();
}
