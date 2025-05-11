import { hideSearchModal, hideSideMenu } from '..';
import { memoContentDB } from '../db';
import { Memo, MemoContentDto, MemoDto, MemoSearchDto } from '../model';
import { defaultModal, formatDate, Modal, ModalSize } from '../util';
import { createViewer } from './editor';
import { applyMemoToEditor } from './memo';

export const generateMemoHistoryContent = (memoDto: MemoDto | MemoSearchDto): HTMLElement => {
  const historyContainer = document.createElement('div');

  const memoContents = memoDto.contentDtos.sort((a, b) => a.id - b.id);
  let selectVersion = memoContents.length - 1;

  // version buttons
  const versionContainer = document.createElement('div');
  versionContainer.className =
    'space-x-2 mb-2 pb-1 flex whitespace-nowrap overflow-x-auto';
  versionContainer.style.scrollbarWidth = 'none';

  memoContents.forEach((content, index) => {
    const versionButton = document.createElement('button');
    versionButton.className =
      'bg-teal-100 hover:bg-teal-200 dark:bg-teal-800 dark:hover:bg-teal-700 text-teal-700 dark:text-teal-200 text-xs rounded px-2 py-1 delete-btn';
    if (index === memoContents.length - 1) {
      versionButton.textContent = `Latest${('isMatching' in content && content.isMatching ? ' *' : '')}`;
    } else {
      versionButton.textContent = `v${index + 1}${('isMatching' in content && content.isMatching ? ' *' : '')}`;
    }
    versionButton.addEventListener('click', () => {
      const viewContainer = document.querySelector<HTMLDivElement>('#memo-viewer');
      if (viewContainer) {
        viewContainer.innerHTML = ''; // Clear previous content
        createViewer(viewContainer, content.text);
      }
      if (index === memoContents.length - 1) {
        versionText.textContent = `Version: Latest (${formatDate(content.createdAt)})`;
      } else {
        versionText.textContent = `Version: v${index + 1} (${formatDate(content.createdAt)})`;
      }
      selectVersion = index;
    });
    versionContainer.appendChild(versionButton);
  });
  historyContainer.appendChild(versionContainer);

  // content details
  const detailsContainer = document.createElement('div');
  detailsContainer.className = 'flex justify-between space-x-2 mb-2';

  // version details
  const versionText = document.createElement('div');
  versionText.className = 'text-lg text-gray-500 dark:text-gray-300';
  versionText.textContent = `Version: Latest (${formatDate(memoContents[memoContents.length - 1].createdAt)})`;
  detailsContainer.appendChild(versionText);

  // action buttons
  const actionContainer = document.createElement('div');
  actionContainer.className = 'flex space-x-2 mb-2';

  // inner modal
  const innerModalElem = document.createElement('div');
  actionContainer.appendChild(innerModalElem);
  const innerModal = new Modal(innerModalElem);

  // display and delete buttons
  const displayBtn = document.createElement('button');
  displayBtn.className =
    'bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-800 dark:hover:bg-cyan-700 text-cyan-700 dark:text-cyan-200 text-xs rounded px-2 py-1 display-btn';
  const displaySpan = document.createElement('span');
  displaySpan.textContent = 'Display';
  displayBtn.appendChild(displaySpan);
  displayBtn.addEventListener('click', () => {
    const memo = generateMemo(memoContents[selectVersion], memoDto.createdAt);
    applyMemoToEditor(memo);
    hideSideMenu();
    hideSearchModal();
    defaultModal.hide();
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className =
    'bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-200 text-xs rounded px-2 py-1 delete-btn';
  const deleteSpan = document.createElement('span');
  deleteSpan.textContent = 'Delete';
  deleteBtn.appendChild(deleteSpan);
  deleteBtn.addEventListener('click', async () => {
    if (selectVersion === memoContents.length - 1) {
      const modalContent = document.createElement('div');
      modalContent.className = 'text-center p-6';
      modalContent.textContent = 'Cannot delete the last version.';
      innerModal.setModal(modalContent, ModalSize.DEFAULT);
    } else {
      await memoContentDB.deleteById(memoContents[selectVersion].id);
      const modalContent = document.createElement('div');
      modalContent.className = 'text-center p-6';
      modalContent.textContent = `Deleted version v${selectVersion + 1} successfully.`;
      innerModal.setModal(modalContent, ModalSize.DEFAULT);
    }
  });
  actionContainer.appendChild(displayBtn);
  actionContainer.appendChild(deleteBtn);
  detailsContainer.appendChild(actionContainer);
  historyContainer.appendChild(detailsContainer);

  // memo viewer
  const viewContainer = document.createElement('div');
  viewContainer.id = 'memo-viewer';
  viewContainer.className = 'overflow-y-auto shadow-sm';
  createViewer(viewContainer, memoContents[selectVersion].text);
  historyContainer.appendChild(viewContainer);

  return historyContainer;
};

const generateMemo = (contentDto: MemoContentDto, createdAt: Date): Memo => {
  return {
    id: contentDto.id,
    text: contentDto.text,
    createdAt: createdAt,
    updatedAt: contentDto.createdAt,
  };
};
