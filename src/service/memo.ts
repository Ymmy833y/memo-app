import { setSaveIcon } from '..';
import { memoContentDB } from '../db/MemoContentDB';
import { memoHeaderDB } from '../db/MemoHeaderDB';
import { convertToMemo, convertToMemoContentDto, Memo, MemoContent, MemoDto, MemoHeader } from '../model';
import { compressText, decompressText } from '../util';
import { getEditorInstance, updateEditorWithText } from './editor';

export const saveMemo = async () => {
  const editor = getEditorInstance();
  if (!editor) return;
  const text = editor.getMarkdown();
  await upsertMemo(text);
  setSaveIcon('check');
}

export const upsertMemo = async (text: string) => {
  const titleCandidates = text.split(/\r?\n/);
  const title = titleCandidates.find(c => c && c.trim() !== '' && c.replace(/<[^>]*>/g, '') !== '') ?? null;
  if (title === null) {
    return;
  }

  const existMemoHeader = await memoHeaderDB.selectByTitle(title);
  if (!existMemoHeader) {
    const memoHeader = await memoHeaderDB.insert(MemoHeader.fromRequiredArgs(title));
    await memoContentDB.insert(MemoContent.fromRequiredArgs(memoHeader.getId(), compressText(text)));
    return;
  }
  existMemoHeader.setUpdatedAt(new Date());
  await memoHeaderDB.update(existMemoHeader);

  // To reduce the amount of data in indexedDB, if it matches the latest text,
  // delete-insert (actually update createdAt) is performed.
  const latestMemoContent = await memoContentDB.selectLatestByHeaderId(existMemoHeader.getId());
  if (latestMemoContent && latestMemoContent.getText() === compressText(text)) {
    latestMemoContent.setCreatedAt(new Date());
    await memoContentDB.update(latestMemoContent);
  } else {
    await memoContentDB.insert(MemoContent.fromRequiredArgs(existMemoHeader.getId(), compressText(text)));
  }
}

export const getMemoDto = async (id: number): Promise<MemoDto> => {
  const memoHeader = await memoHeaderDB.selectById(id);
  if (!memoHeader) {
    throw new Error(`Memo with ID ${id} not found`);
  }
  const memoContents = await memoContentDB.selectByHeaderId(memoHeader.getId());
  const contentDtos = memoContents.map(memoContent => {
    memoContent.setText(decompressText(memoContent.getText()));
    return convertToMemoContentDto(memoContent);
  });
  return {
    id: memoHeader.getId(),
    title: memoHeader.getTitle(),
    createdAt: memoHeader.getCreatedAt(),
    updatedAt: memoHeader.getUpdatedAt(),
    contentDtos: contentDtos
  };
}

export const getMemo = async (id: number): Promise<Memo> => {
  const memoDto = await getMemoDto(id);
  return convertToMemo(memoDto);
}

export const applyMemoToEditor = async (memo: Memo): Promise<void> => {
  await saveMemo();
  updateEditorWithText(memo.text);
}

export const removeMemo = async (memoDto: MemoDto): Promise<void> => {
  for (const memoContent of memoDto.contentDtos) {
    await memoContentDB.deleteById(memoContent.id);
  }
  await memoHeaderDB.deleteById(memoDto.id);
}
