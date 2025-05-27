import { memoContentDB } from '../db/MemoContentDB';
import { memoHeaderDB } from '../db/MemoHeaderDB';
import { convertToMemo, convertToMemoContentDto, Memo, MemoContent, MemoDto, MemoHeader } from '../model';
import { compressText, decompressText, setDocumentTitle, setSaveIcon } from '../util';
import { getEditorInstance, updateEditorWithText } from './editor';

export const saveMemo = async () => {
  const editor = getEditorInstance();
  if (!editor) return;
  const text = editor.getMarkdown();
  const isSuccess = await upsertMemo(text);
  if (isSuccess) {
    setSaveIcon('check');
    setDocumentTitle(retrieveValidTitle(text));
  }
}

const upsertMemo = async (text: string): Promise<number | undefined> => {
  const title = retrieveValidTitle(text);
  if (title === null) {
    return undefined;
  }

  const existMemoHeader = await memoHeaderDB.selectByTitle(title);
  if (!existMemoHeader) {
    const memoHeader = await memoHeaderDB.insert(MemoHeader.fromRequiredArgs(title));
    await memoContentDB.insert(MemoContent.fromRequiredArgs(memoHeader.getId(), compressText(text)));
    return memoHeader.getId();
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
  return existMemoHeader.getId();
}

export const getMemoDto = async (id: number): Promise<MemoDto> => {
  const memoHeader = await memoHeaderDB.selectById(id);
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
  setDocumentTitle(retrieveValidTitle(memo.text));
}

export const removeMemo = async (memoDto: MemoDto): Promise<void> => {
  for (const memoContent of memoDto.contentDtos) {
    await memoContentDB.deleteById(memoContent.id);
  }
  await memoHeaderDB.deleteById(memoDto.id);
}

export const retrieveValidTitle = (text: string): string | null => {
  const titleCandidates = text.split(/\r?\n/);
  return titleCandidates.find(c => c.replace(/<[^>]*>/g, '').trim()) || null;
}
