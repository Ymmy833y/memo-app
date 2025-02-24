export class Text {
  constructor(row) {
    if (row !== undefined) {
      this.id = row.id;
      this.text = row.text;
      this.create_at = row.create_at;
    }
  }

  /**
   * Generates a plain object for storing in IndexedDB.
   * @returns {object}
   */
  generateRow() {
    if (this.id === undefined) {
      return {
        text: this.text,
        create_at: this.create_at,
      };
    }
    return {
      id: this.id,
      text: this.text,
      create_at: this.create_at,
    };
  }
}
