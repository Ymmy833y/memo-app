
class Text {
  #id;
  #text;
  #createAt;

  constructor(row) {
    if (row !== undefined) this.setRow(row);
  }

  setRow(row) {
    this.#id = row.id;
    this.#text = row.text;
    this.#createAt = row.create_at;
  }

  setId(id) { this.#id = id }
  setText(text) { this.#text = text }
  setCreateAt(createAt) { this.#createAt = createAt }

  getId() { return this.#id }
  getText() { return this.#text }
  getCreateAt() { return this.#createAt }

  generateRow() {
    if (this.#id === undefined) {
      return { 
        text: this.#text, 
        create_at: this.#createAt,
      }
    }
    return { 
      id: this.#id, 
      text: this.#text, 
      create_at: this.#createAt,
  }
  }
}
