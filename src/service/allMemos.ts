import { hideSideMenu } from '..';
import { memoHeaderDB } from '../db';
import { MemoHeader } from '../model';
import { defaultModal, escapeHTML, formatDate, generateConfirmModalContent, ModalSize } from '../util';
import { applyMemoToEditor, getMemo, getMemoDto, removeMemo } from './memo';
import { generateMemoHistoryContent } from './memoHistory';

export const renderAllMemos = async (): Promise<void> => {
  const memoHistories = document.getElementById('all-memos') as HTMLDivElement;
  const memoHeaders = await memoHeaderDB.selectAll();

  // Sort memoHeaders by updatedAt in descending order
  memoHeaders.sort((a, b) => b.getUpdatedAt().getTime() - a.getUpdatedAt().getTime());

  memoHistories.innerHTML = '';
  memoHistories.appendChild(generateAllMemosContent(memoHeaders));
};

const generateAllMemosContent = (memoHeaders: MemoHeader[]): HTMLElement => {
  const allMemosContainer = document.createElement('div');
  allMemosContainer.className = 'space-y-2';

  memoHeaders.forEach((memoHeader) => {
    const li = document.createElement('li');
    li.dataset.id = String(memoHeader.getId());
    li.className = 'bg-gray-50 dark:bg-gray-700 rounded p-3 shadow-sm';

    const headerDiv = document.createElement('div');
    headerDiv.className =
      'flex justify-between items-center mb-2 pb-1 border-b-2';

    const dateSpan = document.createElement('span');
    dateSpan.className = 'text-sm text-gray-500 dark:text-gray-300';
    dateSpan.textContent = formatDate(memoHeader.getUpdatedAt());

    const btnContainer = document.createElement('div');
    btnContainer.className = 'flex space-x-2';

    const displayBtn = document.createElement('button');
    displayBtn.className =
      'bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-800 dark:hover:bg-cyan-700 text-cyan-700 dark:text-cyan-200 text-xs rounded px-2 py-1 display-btn';
    const displaySpan = document.createElement('span');
    displaySpan.textContent = 'Display';
    displayBtn.appendChild(displaySpan);
    displayBtn.addEventListener('click', async () => {
      const memo = await getMemo(memoHeader.getId());
      applyMemoToEditor(memo);
      hideSideMenu();
    });

    const detailsBtn = document.createElement('button');
    detailsBtn.className =
      'bg-teal-100 hover:bg-teal-200 dark:bg-teal-800 dark:hover:bg-teal-700 text-teal-700 dark:text-teal-200 text-xs rounded px-2 py-1 details-btn';
    const detailsSpan = document.createElement('span');
    detailsSpan.textContent = 'Details';
    detailsBtn.appendChild(detailsSpan);
    detailsBtn.addEventListener('click', async () => {
      const memoDto = await getMemoDto(memoHeader.getId());
      defaultModal.setModal(generateMemoHistoryContent(memoDto), ModalSize.XXL);
      defaultModal.show();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className =
      'bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-200 text-xs rounded px-2 py-1 delete-btn';
    const deleteSpan = document.createElement('span');
    deleteSpan.textContent = 'Delete';
    deleteBtn.appendChild(deleteSpan);
    deleteBtn.addEventListener('click', async () => {
      const confirmModalContent = generateConfirmModalContent(
        'Are you sure you want to delete this memo?',
        async () => {
          const memoDto = await getMemoDto(memoHeader.getId());
          await removeMemo(memoDto);
          await renderAllMemos();
          defaultModal.hide();
        },
        () => {
          defaultModal.hide();
        }
      );
      defaultModal.setModal(confirmModalContent, ModalSize.DEFAULT);
    });

    btnContainer.appendChild(displayBtn);
    btnContainer.appendChild(detailsBtn);
    btnContainer.appendChild(deleteBtn);

    headerDiv.appendChild(dateSpan);
    headerDiv.appendChild(btnContainer);

    const titleDiv = document.createElement('div');
    titleDiv.className = 'text-md whitespace-pre-wrap truncate';
    titleDiv.textContent = escapeHTML(memoHeader.getTitle());

    li.appendChild(headerDiv);
    li.appendChild(titleDiv);

    allMemosContainer.appendChild(li);
  });

  return allMemosContainer;
};
