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

export * from './modal';
