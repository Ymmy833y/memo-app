import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  Modal,
  ModalSize,
  generateConfirmModalContent,
  defaultModal,
} from '../../src/util';

describe('ModalSize enum', () => {
  it('defines the correct string values', () => {
    expect(ModalSize.DEFAULT).toBe('md');
    expect(ModalSize.LG).toBe('lg');
    expect(ModalSize.XL).toBe('xl');
    expect(ModalSize.XXL).toBe('4xl');
    expect(ModalSize.FULL).toBe('full');
  });
});

describe('Modal class', () => {
  let modalElem: HTMLDivElement;
  let modal: Modal;

  beforeEach(() => {
    modalElem = document.createElement('div');
    modal = new Modal(modalElem);
  });

  it('initializeModalStyle adds required base classes', () => {
    const expected = [
      'fixed', 'inset-0', 'flex', 'items-center', 'justify-center',
      'bg-black', 'bg-opacity-50', 'hidden', 'z-50',
    ];
    expected.forEach(cls => {
      expect(modalElem.classList.contains(cls)).toBe(true);
    });
  });

  describe('show/hide lifecycle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('show(): un-hides and fades in', () => {
      modal.show();
      // immediately after show(): hidden is removed
      expect(modalElem.classList.contains('hidden')).toBe(false);
      // before timer, opacity-100 not yet added
      expect(modalElem.classList.contains('opacity-100')).toBe(false);
      vi.advanceTimersByTime(10);
      expect(modalElem.classList.contains('opacity-100')).toBe(true);
    });

    it('hide(): fades out then hides', () => {
      // ensure it's shown first
      modal.show();
      vi.advanceTimersByTime(10);

      modal.hide();
      // immediately: opacity-0 present, opacity-100 removed
      expect(modalElem.classList.contains('opacity-0')).toBe(true);
      expect(modalElem.classList.contains('opacity-100')).toBe(false);

      vi.advanceTimersByTime(300);
      expect(modalElem.classList.contains('hidden')).toBe(true);
    });
  });

  describe('setModal()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      // clear any classes so we can inspect fades easily
      modal = new Modal(modalElem);
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('renders content, default fade, default size, and shows', () => {
      const content = document.createElement('div');
      content.textContent = 'BODY';
      modal.setModal(content);

      // inner dialog
      const dialog = modalElem.firstElementChild as HTMLElement;
      // close button + passed content
      const closeBtn = dialog.querySelector('button') as HTMLButtonElement;
      expect(closeBtn.innerText).toBe('✕');
      expect(dialog.textContent).toContain('BODY');

      // fade classes applied
      expect(modalElem.classList.contains('transition-opacity')).toBe(true);
      expect(modalElem.classList.contains('duration-300')).toBe(true);

      // default size: no max-w-*, no w-full
      const hasSize = Array.from(dialog.classList).some(c =>
        c.startsWith('max-w-') || c === 'w-full'
      );
      expect(hasSize).toBe(false);

      // shown
      expect(modalElem.classList.contains('hidden')).toBe(false);
      vi.advanceTimersByTime(10);
      expect(modalElem.classList.contains('opacity-100')).toBe(true);
    });

    it('honors size, fade=false, isShow=false, hideOnOutsideClick=false', () => {
      const content = document.createElement('div');
      content.textContent = 'X';
      modal.setModal(content, ModalSize.LG, false, false, false);

      // no fade classes
      expect(modalElem.classList.contains('transition-opacity')).toBe(false);
      expect(modalElem.classList.contains('duration-300')).toBe(false);

      // dialog size classes w-full + max-w-lg
      const dialog = modalElem.firstElementChild as HTMLElement;
      expect(dialog.classList.contains('w-full')).toBe(true);
      expect(dialog.classList.contains('max-w-lg')).toBe(true);

      // not shown => remains hidden
      expect(modalElem.classList.contains('hidden')).toBe(true);
    });

    it('hideOnOutsideClick: clicking backdrop calls hide()', () => {
      const content = document.createElement('div');
      modal.setModal(content, undefined, true, true, true);
      vi.advanceTimersByTime(10);

      const hideSpy = vi.spyOn(modal, 'hide');
      // click on backdrop (modalElem)
      modalElem.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(hideSpy).toHaveBeenCalled();
    });
  });
});

describe('generateConfirmModalContent()', () => {
  it('renders a string message with OK/Cancel buttons that invoke callbacks', () => {
    const onOk = vi.fn();
    const onCancel = vi.fn();
    const el = generateConfirmModalContent('Sure?', onOk, onCancel);

    // message <p>
    const p = el.querySelector('p')!;
    expect(p.textContent).toBe('Sure?');

    // two buttons: [Cancel, OK]
    const buttons = Array.from(el.querySelectorAll('button'));
    expect(buttons).toHaveLength(2);

    buttons[0].click();
    expect(onCancel).toHaveBeenCalled();

    buttons[1].click();
    expect(onOk).toHaveBeenCalled();
  });

  it('renders an HTMLElement message and preserves it with mb-6 class', () => {
    const msgEl = document.createElement('div');
    msgEl.textContent = 'Hello!';
    const onOk = vi.fn();
    const onCancel = vi.fn();
    const el = generateConfirmModalContent(msgEl, onOk, onCancel);

    // our original element should now have 'mb-6'
    expect(msgEl.classList.contains('mb-6')).toBe(true);
    // and be appended
    expect(el.contains(msgEl)).toBe(true);
  });
});

describe('defaultModal proxy', () => {
  beforeEach(() => {
    // ensure the underlying element is present
    document.body.innerHTML = '<div id="default-modal"></div>';
  });

  it('delegates show() and hide() to a real Modal instance', () => {
    // spy on Modal.prototype
    const showSpy = vi.spyOn(Modal.prototype, 'show');
    const hideSpy = vi.spyOn(Modal.prototype, 'hide');

    defaultModal.show();
    expect(showSpy).toHaveBeenCalled();

    defaultModal.hide();
    expect(hideSpy).toHaveBeenCalled();
  });
});
