import LZString from 'lz-string';

/**
 * Escape strings to display in HTML
 * @param {string} str
 * @returns {string}
 */
export const escapeHTML = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Compresses a given string into a UTF-16 encoded compressed format.
 *
 * @param text - The input text to be compressed.
 * @returns A UTF-16 encoded compressed string.
 */
export const compressText = (text: string): string => {
  return LZString.compressToUTF16(text);
}

/**
 * Decompresses a UTF-16 encoded compressed string back into its original format.
 *
 * @param compressedText - The compressed text to be decompressed.
 * @returns The original uncompressed string. If decompression fails, returns an empty string.
 */
export const decompressText = (compressedText: string): string => {
  const result = LZString.decompressFromUTF16(compressedText);
  return result === null ? '' : result;
}

/**
 * Formats a Date object into a string representation.
 *
 * @param date - The Date object to format.
 * @returns A string representing the formatted date and time.
 */
export const formatDate = (date: Date): string => {
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

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

export * from './modal';
