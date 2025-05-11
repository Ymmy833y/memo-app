/* eslint-disable @typescript-eslint/no-explicit-any */
export class MemoHeader {
  private id!: number;
  private title: string;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(id: number | undefined, title: string, createdAt: Date, updatedAt: Date) {
    if (id !== undefined) {
      this.id = id;
    }
    this.title = title;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromRow(row: any) {
    return new MemoHeader(
      row.id,
      row.title,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  static fromRequiredArgs(title: string): MemoHeader {
    return new MemoHeader(undefined, title, new Date(), new Date());
  }

  setId(id: number): void { this.id = id; }
  setTitle(title: string): void { this.title = title; }
  setCreatedAt(createdAt: Date): void { this.createdAt = createdAt; }
  setUpdatedAt(updatedAt: Date): void { this.updatedAt = updatedAt; }

  getId(): number { return this.id; }
  getTitle(): string { return this.title; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  generateRow(): any {
    const row: any = {
      title: this.title,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
    if (this.id !== undefined) {
      row.id = this.id;
    }
    return row;
  }
}
