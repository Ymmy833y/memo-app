import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as theme from '../../src/service/theme';

describe('Theme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = `
      <button id="toggle-theme">
        <svg><use xlink:href="#placeholder"></use></svg>
      </button>
    `;
    document.documentElement.className = '';
  });

  describe('getCurrentTheme', () => {
    it('returns stored theme if present', () => {
      localStorage.setItem('editorTheme', 'light');
      expect(theme.getCurrentTheme()).toBe('light');
      localStorage.setItem('editorTheme', 'dark');
      expect(theme.getCurrentTheme()).toBe('dark');
    });
    it('defaults to dark when no stored theme and prefers-color-scheme is dark', () => {
      vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        onchange: null,
      } as any);
      expect(theme.getCurrentTheme()).toBe('dark');
    });
    it('defaults to light when no stored theme and prefers-color-scheme is light', () => {
      vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        onchange: null,
      } as any);
      expect(theme.getCurrentTheme()).toBe('light');
    });
  });

  describe('setCurrentTheme', () => {
    it('saves theme to localStorage', () => {
      theme.setCurrentTheme('dark');
      expect(localStorage.getItem('editorTheme')).toBe('dark');
      theme.setCurrentTheme('light');
      expect(localStorage.getItem('editorTheme')).toBe('light');
    });
  });

  describe('toggleTheme', () => {
    it('toggles from dark to light and updates DOM + storage', () => {
      localStorage.setItem('editorTheme', 'dark');

      const result = theme.toggleTheme();
      expect(result).toBe('light');
      expect(localStorage.getItem('editorTheme')).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      const useEl = document.querySelector<SVGUseElement>('#toggle-theme svg use')!;
      expect(useEl.getAttribute('xlink:href')).toBe('#light_mode');
    });

    it('toggles from light to dark and updates DOM + storage', () => {
      localStorage.setItem('editorTheme', 'light');

      const result = theme.toggleTheme();
      expect(result).toBe('dark');
      expect(localStorage.getItem('editorTheme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      const useEl = document.querySelector<SVGUseElement>('#toggle-theme svg use')!;
      expect(useEl.getAttribute('xlink:href')).toBe('#dark_mode');
    });
  });

  describe('applyGlobalTheme', () => {
    it('adds .dark class and dark icon when called with "dark"', () => {
      theme.applyGlobalTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      const useEl = document.querySelector<SVGUseElement>('#toggle-theme svg use')!;
      expect(useEl.getAttribute('xlink:href')).toBe('#dark_mode');
    });

    it('removes .dark class and light icon when called with "light"', () => {
      document.documentElement.classList.add('dark');
      theme.applyGlobalTheme('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      const useEl = document.querySelector<SVGUseElement>('#toggle-theme svg use')!;
      expect(useEl.getAttribute('xlink:href')).toBe('#light_mode');
    });

    it('falls back to getCurrentTheme when no argument is passed', () => {
      vi.spyOn(theme, 'getCurrentTheme').mockReturnValue('light');
      document.documentElement.classList.add('dark');
      theme.applyGlobalTheme();
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      const useEl = document.querySelector<SVGUseElement>('#toggle-theme svg use')!;
      expect(useEl.getAttribute('xlink:href')).toBe('#light_mode');
    });
  });
});
