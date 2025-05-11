/* eslint-disable @typescript-eslint/no-explicit-any */
export class MemoContent {
  private id!: number;
  private headerId: number;
  private text: string;
  private createdAt: Date;

  constructor(id: number | undefined, headerId: number, text: string, createdAt: Date) {
    if (id !== undefined) {
      this.id = id;
    }
    this.headerId = headerId;
    this.text = text;
    this.createdAt = createdAt;
  }

  static fromRow(row: any) {
    return new MemoContent(
      row.id,
      row.header_id,
      row.text,
      new Date(row.created_at)
    );
  }

  static fromRequiredArgs(headerId: number, text: string): MemoContent {
    return new MemoContent(undefined, headerId, text, new Date());
  }

  setId(id: number): void { this.id = id; }
  setHeaderId(headerId: number): void { this.headerId = headerId; }
  setText(text: string): void { this.text = text; }
  setCreatedAt(createdAt: Date): void { this.createdAt = createdAt; }

  getId(): number { return this.id; }
  getHeaderId(): number { return this.headerId; }
  getText(): string { return this.text; }
  getCreatedAt(): Date { return this.createdAt; }

  generateRow(): any {
    const row: any = {
      header_id: this.headerId,
      text: this.text,
      created_at: this.createdAt,
    };
    if (this.id !== undefined) {
      row.id = this.id;
    }
    return row;
  }
}
