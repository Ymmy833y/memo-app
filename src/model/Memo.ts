import { MemoContent } from './MemoContent';

export interface MemoContentDto {
  id: number;
  text: string;
  createdAt: Date;
}

export interface MemoDto {
  id: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  contentDtos: MemoContentDto[];
}

export interface Memo {
  id: number;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoSearchContentDto {
  id: number;
  text: string;
  createdAt: Date;
  isMatching: boolean;
}

export interface MemoSearchDto {
  id: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  contentDtos: MemoSearchContentDto[];
}

export const convertToMemoContentDto = (memoContent: MemoContent): MemoContentDto => {
  return {
    id: memoContent.getId(),
    text: memoContent.getText(),
    createdAt: memoContent.getCreatedAt(),
  };
};

export const convertToMemo = (memoDto: MemoDto): Memo => {
  const text = memoDto.contentDtos.sort((a, b) => b.id - a.id)[0]?.text || '';
  return {
    id: memoDto.id,
    text: text,
    createdAt: memoDto.createdAt,
    updatedAt: memoDto.updatedAt,
  };
};
