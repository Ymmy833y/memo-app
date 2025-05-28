import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initializeAutoSave,
  toggleAutoSave,
  changeAutoSaveInterval,
} from '../../src/service/autoSave';
import { saveMemo } from '../../src/service/memo';

vi.mock('../../src/service/memo', () => ({
  saveMemo: vi.fn(),
}));

describe('autoSave', () => {
  let btn: HTMLButtonElement;
  let select: HTMLSelectElement;

  beforeEach(() => {
    // reset localStorage
    localStorage.clear();

    // create minimal DOM for icon + interval dropdown
    document.body.innerHTML = `
      <button id="auto-save-btn">
        <svg><use xlink:href="#unChecked"></use></svg>
      </button>
      <select id="auto-save-interval">
        <option value="60000">1m</option>
        <option value="180000">3m</option>
        <option value="300000">5m</option>
      </select>
    `;
    btn = document.getElementById('auto-save-btn') as HTMLButtonElement;
    select = document.getElementById('auto-save-interval') as HTMLSelectElement;

    // use fake timers for scheduling
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('initializeAutoSave', () => {
    it('should read settings, update icon & dropdown, and not start autosave when disabled', () => {
      // by default nothing in localStorage → disabled, default 180000ms
      initializeAutoSave();

      const svg = btn.querySelector('svg')!;
      expect(svg.getAttribute('fill')).toBe('#ef4444');
      expect(svg.querySelector('use')!.getAttribute('xlink:href')).toBe('#unChecked');

      // dropdown now reflects the default interval
      expect(select.value).toBe('180000');

      // no timer has been set → saveMemo not called
      vi.advanceTimersByTime(180000);
      expect(saveMemo).not.toHaveBeenCalled();
    });
  });

  describe('toggleAutoSave', () => {
    it('should enable auto-save when off, and disable when on', () => {
      toggleAutoSave();

      expect(localStorage.getItem('autoSaveEnabled')).toBe('true');
      let svg = btn.querySelector('svg')!;
      expect(svg.getAttribute('fill')).toBe('#22c55e');

      vi.advanceTimersByTime(180000);
      expect(saveMemo).toHaveBeenCalledTimes(1);

      toggleAutoSave();

      expect(localStorage.getItem('autoSaveEnabled')).toBe('false');
      svg = btn.querySelector('svg')!;
      expect(svg.getAttribute('fill')).toBe('#ef4444');

      vi.advanceTimersByTime(180000);
      expect(saveMemo).toHaveBeenCalledTimes(1);
    });
  });

  describe('changeAutoSaveInterval', () => {
    it('should set new interval, update dropdown, and restart auto-save', () => {
      toggleAutoSave(); // start first

      const fakeEvent = { target: { value: '300000' } } as unknown as Event;
      changeAutoSaveInterval(fakeEvent);

      expect(select.value).toBe('300000');
      expect(localStorage.getItem('autoSaveInterval')).toBe('300000');

      vi.advanceTimersByTime(300000);
      expect(saveMemo).toHaveBeenCalled();
    });
  });
});
