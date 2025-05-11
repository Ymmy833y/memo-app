export enum ModalSize {
  DEFAULT = 'md',
  LG = 'lg',
  XL = 'xl',
  XXL = '4xl',
  FULL = 'full',
}

export class Modal {
  private modalElem: HTMLElement;
  private isShown = false;

  constructor(modalElem: HTMLElement) {
    this.modalElem = modalElem;
    this.initializeModalStyle();
  }

  private initializeModalStyle(): void {
    const classesToEnsure = ['fixed', 'inset-0', 'flex', 'items-center', 'justify-center', 'bg-black', 'bg-opacity-50', 'hidden'];
    classesToEnsure.forEach(cls => {
      if (!this.modalElem.classList.contains(cls)) {
        this.modalElem.classList.add(cls);
      }
    });
  }

  /**
   * Initialize the modal
   * @param content The content to set for the modal element
   * @param size Size specification (e.g., "lg", "xl", "fl-lg", "fl", etc.)
   * @param isShow Whether to show the modal initially
   * @param fade Whether to apply a fade effect
   * @param hideOnOutsideClick Whether to hide the modal when clicking outside
   */
  public setModal(
    content: HTMLElement,
    size = ModalSize.DEFAULT,
    isShow = true,
    fade = true,
    hideOnOutsideClick = true
  ): void {
    this.setModalContent(content);
    this.setModalFade(fade);
    this.setModalSize(size);

    if (this.isShown) {
      this.hide();
    }
    if (isShow) {
      this.show();
    }

    if (hideOnOutsideClick) {
      this.modalElem.addEventListener('click', this.handleOutsideClick.bind(this));
    }
  }

  /**
   * Set the content for modalElem
   */
  private setModalContent(content: HTMLElement): void {
    const dialogElem = this.generateDialogElem();
    dialogElem.appendChild(this.generateCloseBtn());
    dialogElem.appendChild(content);

    this.modalElem.innerHTML = '';
    this.modalElem.appendChild(dialogElem);
  }

  /**
   * Set Tailwind classes for size on the inner dialog (first child)
   */
  private setModalSize(size: ModalSize): void {
    const dialogElem = this.modalElem.firstElementChild as HTMLElement;
    if (!dialogElem) return;
    // Remove existing size classes (e.g., max-w-*, w-full)
    dialogElem.classList.forEach((cls) => {
      if (cls.startsWith('max-w-') || cls === 'w-full') {
        dialogElem.classList.remove(cls);
      }
    });
    switch (size) {
    case ModalSize.LG:
      dialogElem.classList.add('w-full', 'max-w-lg');
      break;
    case ModalSize.XL:
      dialogElem.classList.add('w-full', 'max-w-xl');
      break;
    case ModalSize.XXL:
      dialogElem.classList.add('w-full', 'max-w-4xl');
      break;
    case ModalSize.FULL:
      dialogElem.classList.add('w-full');
      break;
    default:
      break;
    }
  }

  /**
   * Apply classes to modalElem based on whether fade effect is enabled
   */
  private setModalFade(fade: boolean): void {
    if (fade) {
      this.modalElem?.classList.add('transition-opacity', 'duration-300');
    } else {
      this.modalElem?.classList.remove('transition-opacity', 'duration-300');
    }
  }

  /**
   * Show the modal: remove the 'hidden' class and set opacity to 100.
   */
  public show(): void {
    // Remove the 'hidden' class
    this.modalElem.classList.remove('hidden');
    // Wait briefly then fade in
    setTimeout(() => {
      this.modalElem.classList.remove('opacity-0');
      this.modalElem.classList.add('opacity-100');
    }, 10);
    this.isShown = true;
  }

  /**
   * Hide the modal: set opacity to 0 and then add the 'hidden' class.
   */
  public hide(): void {
    this.modalElem.classList.remove('opacity-100');
    this.modalElem.classList.add('opacity-0');
    setTimeout(() => {
      // Wait time matching duration-300
      this.modalElem.classList.add('hidden');
    }, 300);
    this.isShown = false;
  }

  /**
   * Handler for when the area outside the modal is clicked
   */
  private handleOutsideClick(event: MouseEvent): void {
    if (event.target === this.modalElem) {
      this.hide();
    }
  }

  private generateDialogElem(): HTMLElement {
    const modal = document.createElement('div');
    modal.className =
      'relative bg-white dark:bg-gray-800 p-6 rounded shadow-lg max-h-[90vh] overflow-y-auto';
    return modal;
  }


  private generateCloseBtn(): HTMLElement {
    const wrapElem = document.createElement('div');
    wrapElem.className = 'flex justify-end mb-2';
    const closeBtn = document.createElement('button');
    closeBtn.className =
      'w-8 h-8 rounded-[1vw] border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 flex items-center justify-center transition-colors';
    closeBtn.innerText = '✕';
    closeBtn.addEventListener('click', () => {
      this.hide();
    });
    wrapElem.appendChild(closeBtn);
    return wrapElem;
  }
}

/**
 * Generate generic confirm modal content
 *
 * @param message   Confirmation message; accepts a string or an HTMLElement
 * @param onOk      Callback to execute when the OK button is clicked
 * @param onCancel  Callback to execute when the Cancel button is clicked
 * @returns         An HTMLElement containing the modal content
 */
export const generateConfirmModalContent = (
  message: string | HTMLElement,
  onOk: () => void,
  onCancel: () => void,
): HTMLElement => {
  const modalContent = document.createElement('div');
  modalContent.className = 'text-center p-6';

  // Message
  if (typeof message === 'string') {
    const messageEl = document.createElement('p');
    messageEl.className = 'mb-6 text-sm sm:text-base';
    messageEl.textContent = message;
    modalContent.appendChild(messageEl);
  } else {
    // If an HTMLElement is provided
    message.classList.add('mb-6');
    modalContent.appendChild(message);
  }

  // Button wrapper
  const buttonWrap = document.createElement('div');
  buttonWrap.className = 'flex justify-center gap-4';

  const okButton = document.createElement('button');
  okButton.type = 'button';
  okButton.textContent = 'OK';
  okButton.className =
    'px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors';
  okButton.addEventListener('click', () => {
    onOk();
  });

  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.textContent = 'Cancel';
  cancelButton.className =
    'px-4 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition-colors';
  cancelButton.addEventListener('click', () => {
    onCancel();
  });

  buttonWrap.appendChild(cancelButton);
  buttonWrap.appendChild(okButton);
  modalContent.appendChild(buttonWrap);

  return modalContent;
};

const defaultModalElem = document.getElementById('default-modal') as HTMLDivElement;
export const defaultModal = new Modal(defaultModalElem);
