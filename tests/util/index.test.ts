import { describe, it, expect, beforeEach } from 'vitest';
import LZString from 'lz-string';
import {
  escapeHTML,
  decompressText,
  setClipboardIcon,
  setSaveIcon,
  hideSideMenu,
  hideSearchModal,
} from '../../src/util';

describe('escapeHTML', () => {
  it('should escape ampersand', () => {
    expect(escapeHTML('&')).toBe('&amp;');
  });

  it('should escape less-than and greater-than', () => {
    expect(escapeHTML('<')).toBe('&lt;');
    expect(escapeHTML('>')).toBe('&gt;');
  });

  it('should escape double and single quotes', () => {
    expect(escapeHTML('"')).toBe('&quot;');
    expect(escapeHTML('\'')).toBe('&#039;');
  });

  it('should escape all special characters in a mixed string', () => {
    const input = 'Tom & Jerry < "Cartoon">\'s show';
    const expected = 'Tom &amp; Jerry &lt; &quot;Cartoon&quot;&gt;&#039;s show';
    expect(escapeHTML(input)).toBe(expected);
  });

  it('should leave safe characters unchanged', () => {
    const safe = 'Hello, World! 123';
    expect(escapeHTML(safe)).toBe(safe);
  });

  it('should handle empty string', () => {
    expect(escapeHTML('')).toBe('');
  });
});

describe('decompressText', () => {
  it('should decompress a UTF-16 compressed string', () => {
    const original = 'The quick brown fox jumps over the lazy dog';
    const compressed = LZString.compressToUTF16(original);
    const result = decompressText(compressed);
    expect(result).toBe(original);
  });

  it('should return empty string when input is invalid or decompress returns null', () => {
    // Passing a random string that isn't valid UTF-16 compressed data
    expect(decompressText('not-a-valid-compressed-string')).toBe('');
    // Empty input should also produce empty output
    expect(decompressText('')).toBe('');
  });
});

describe('setClipboardIcon', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="clipboard-btn">
        <svg><use href="#clipboard_default"></use></svg>
      </button>
    `;
  });

  it('should set the use href to "#clipboard_check" when state is "check"', () => {
    setClipboardIcon('check');

    const useEl = document
      .getElementById('clipboard-btn')!
      .querySelector('svg use')! as SVGUseElement;

    expect(useEl.getAttribute('href')).toBe('#clipboard_check');
  });

  it('should set the use href to "#clipboard_default" when state is not "check"', () => {
    // simulate check then other
    setClipboardIcon('check');
    setClipboardIcon('other');

    const useEl = document
      .getElementById('clipboard-btn')!
      .querySelector('svg use')! as SVGUseElement;

    expect(useEl.getAttribute('href')).toBe('#clipboard_default');
  });
});

describe('setSaveIcon', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="save-btn">
        <svg><use href="#save_default"></use></svg>
      </button>
    `;
  });

  it('should set the use href to "#save_check" when state is "check"', () => {
    setSaveIcon('check');

    const useEl = document
      .getElementById('save-btn')!
      .querySelector('svg use')! as SVGUseElement;

    expect(useEl.getAttribute('href')).toBe('#save_check');
  });

  it('should set the use href to "#save_default" when state is not "check"', () => {
    setSaveIcon('check');
    setSaveIcon('other');

    const useEl = document
      .getElementById('save-btn')!
      .querySelector('svg use')! as SVGUseElement;

    expect(useEl.getAttribute('href')).toBe('#save_default');
  });
});

describe('hideSideMenu', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="side-menu" class=""></div>';
  });

  it('should add "translate-x-full" class when it is not present', () => {
    hideSideMenu();
    const menu = document.getElementById('side-menu')!;
    expect(menu.classList.contains('translate-x-full')).toBe(true);
  });

  it('should not duplicate the "translate-x-full" class if it is already present', () => {
    const menu = document.getElementById('side-menu')!;
    menu.classList.add('translate-x-full');

    hideSideMenu();

    const occurrences = Array.from(menu.classList).filter(
      (c) => c === 'translate-x-full'
    ).length;
    expect(occurrences).toBe(1);
  });
});

describe('hideSearchModal', () => {
  beforeEach(() => {
    // Set up a clean DOM with the search-modal element
    document.body.innerHTML = '<div id="search-modal" class=""></div>';
  });

  it('should add the "hidden" class to the search modal element', () => {
    // Invoke the function to hide the modal
    hideSearchModal();
    // Retrieve the modal element from the DOM
    const modal = document.getElementById('search-modal')!;
    // Verify that the "hidden" class has been added
    expect(modal.classList.contains('hidden')).toBe(true);
  });

  it('should preserve existing classes when adding "hidden"', () => {
    // Add a preexisting class to the modal
    const modal = document.getElementById('search-modal')!;
    modal.classList.add('existing-class');
    // Hide the modal
    hideSearchModal();
    // Ensure the original class is still present
    expect(modal.classList.contains('existing-class')).toBe(true);
    // Ensure the "hidden" class has been added
    expect(modal.classList.contains('hidden')).toBe(true);
  });
});
