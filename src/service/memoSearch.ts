import { memoContentDB } from '../db';
import { MemoSearchDto } from '../model';
import { getMemoDto } from './memo';
import { generateMemoHistoryContent } from './memoHistory';

export const renderMemoSearch = async (keyword: string, caseSensitive: boolean): Promise<void> => {
  if (!keyword) {
    return;
  }
  const searchResultsContent = document.getElementById('search-results') as HTMLDivElement;
  searchResultsContent.innerHTML = '';

  const memoSearchDtos = await findMemosByKeyword(keyword, caseSensitive);
  if (memoSearchDtos.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'text-gray-500 dark:text-gray-300';
    noResults.textContent = 'No results found.';
    searchResultsContent.appendChild(noResults);
    toggleSearchPreview(false);
    return;
  }

  memoSearchDtos.forEach(memo => {
    const memoElement = document.createElement('button');
    memoElement.className = 'py-2 px-2 text-left hover:bg-gray-200 dark:hover:bg-gray-700 rounded';
    memoElement.innerHTML = memo.title;
    memoElement.addEventListener('click', () => showSearchPreview(memo));

    searchResultsContent.appendChild(memoElement);
  });
}

const findMemosByKeyword = async (keyword: string, caseSensitive: boolean): Promise<MemoSearchDto[]> => {
  const memoContents = await memoContentDB.selectByKeyword(keyword, caseSensitive);
  const memoContentIds = memoContents.map(memoContent => memoContent.getId());
  const memoIds = [...new Set(memoContents.map(memoContent => memoContent.getHeaderId()))];

  const memoSearchDto: MemoSearchDto[] = [];
  for (const memoId of memoIds) {
    const memoDto = await getMemoDto(memoId);
    memoSearchDto.push({
      id: memoDto.id,
      title: memoDto.title,
      createdAt: memoDto.createdAt,
      updatedAt: memoDto.updatedAt,
      contentDtos: memoDto.contentDtos.map(contentDto => ({
        id: contentDto.id,
        text: contentDto.text,
        createdAt: contentDto.createdAt,
        isMatching: memoContentIds.includes(contentDto.id),
      })),
    });
  }
  return memoSearchDto;
}

const showSearchPreview = (memo: MemoSearchDto): void => {
  const previewContent = document.getElementById('search-preview') as HTMLDivElement;
  previewContent.innerHTML = '';
  previewContent.appendChild(generateMemoHistoryContent(memo));
  toggleSearchPreview(true);
}

const toggleSearchPreview = (show: boolean): void => {
  const resultsContainer = document.getElementById('search-results') as HTMLDivElement;
  const previewContainer = document.getElementById('search-preview') as HTMLDivElement;
  if (show) {
    resultsContainer.classList.remove('w-full');
    resultsContainer.classList.add('w-1/2');
    previewContainer.classList.remove('hidden');
  } else {
    resultsContainer.classList.add('w-full');
    resultsContainer.classList.remove('w-1/2');
    previewContainer.classList.add('hidden');
  }
}
