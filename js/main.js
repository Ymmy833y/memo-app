
const textDB = new TextDB;
new IndexedDB().initDB([textDB.setUpDB()]);

let isClipboardCheck = false;
let isAutoSave = true;
let autoSaveInterval = 3 * 60 * 1000;

let texts = [];

class HistoryItem {
  #ELEM;
  #text;
  /**
   * @param {Text} text 
   */
  constructor(text) {
    this.#ELEM = document.createElement('li');
    this.#text = text;

    this.#createElem();
  }

  #createElem = () => {
    this.#ELEM.classList.add('list-group-item');
    const row = document.createElement('div');
    row.classList.add('row');
    const contentForDate = document.createElement('div');
    contentForDate.classList.add('col-2');
    contentForDate.innerText = formatDateTime(this.#text.getCreateAt());
    const contentForText = document.createElement('div');
    contentForText.classList.add('col-9', 'historyItem');
    contentForText.innerText = truncateAfterFifthNewline(this.#text.getText());
    const contentForFunc = document.createElement('div');
    contentForFunc.classList.add('col-1', 'p-0');
    const displayBtn = document.createElement('button');
    displayBtn.classList.add('btn', 'btn-outline-secondary', 'w-100', 'mb-1', 'px-0');
    const displayDetailText = document.createElement('div');
    displayDetailText.classList.add('d-none', 'd-sm-inline');
    displayDetailText.innerText = '表示';
    displayBtn.appendChild(displayDetailText);
    const displayDetailIcon = document.createElement('div');
    displayDetailIcon.classList.add('d-sm-none');
    displayDetailIcon.innerHTML = createIconElem('indicate');
    displayBtn.appendChild(displayDetailIcon);
    contentForFunc.appendChild(displayBtn);
    const removeBtn = document.createElement('button');
    removeBtn.classList.add('btn', 'btn-outline-danger', 'w-100', 'px-0');
    const removeDetailText = document.createElement('div');
    removeDetailText.classList.add('d-none', 'd-sm-inline');
    removeDetailText.innerText = '削除';
    removeBtn.appendChild(removeDetailText);
    const removeDetailIcon = document.createElement('div');
    removeDetailIcon.classList.add('d-sm-none');
    removeDetailIcon.innerHTML = createIconElem('remove');
    removeBtn.appendChild(removeDetailIcon);
    contentForFunc.appendChild(removeBtn);

    row.appendChild(contentForDate);
    row.appendChild(contentForText);
    row.appendChild(contentForFunc);
    this.#ELEM.appendChild(row);

    displayBtn.addEventListener('click', () => {
      innsertText();
      document.getElementById('editor-textarea').value = this.#text.getText();
      updateContent();
      hideOffcanvas();
    });
    removeBtn.addEventListener('click', () => {
      removeText(this.#text.getId());
    })
  }

  getElem = () => { return this.#ELEM }
}

class HistroyItemForSearch {
  #ELEM;
  #text;
  #positions;
  /**
   * @param {Text} text 
   * @param {String} word 
   */
  constructor(text, word) {
    this.#ELEM = document.createElement('button');
    this.#text = text;
    this.#positions = findAllOccurrences(this.#text.getText(), word);

    this.#createElem();
  }

  #createElem() {
    this.#ELEM.classList.add("list-group-item", "list-group-item-action");
    const firstPostion = this.#positions[0];
    const linePosition = getLinePosition(this.#text.getText(), firstPostion);
    
    this.#ELEM.innerHTML = highlightSearchWords(
      this.#text.getText().slice(linePosition.startOfLine, linePosition.endOfLine), 
      this.#positions
        .filter(({ start }) => start <= linePosition.endOfLine)
        .map(({ start, end }) => ({
          start: start - linePosition.startOfLine,
          end: end - linePosition.startOfLine
        }))
    );

    this.#ELEM.addEventListener('click', () => this.#renderDetailElem());
    this.#ELEM.addEventListener('dblclick', () => this.#renderEditorElem());
  }

  #renderDetailElem() {
    const searchItemDetailElem = document.getElementById('search-item-detail');
    const searchItemDateElem = document.getElementById('search-item-date');
    const searchItemDisplayBtnElem = document.getElementById('search-item-display-btn');
    const searchItemTextElem = document.getElementById('search-item-text');
    searchItemDetailElem.classList.remove('d-none');

    searchItemDateElem.innerText = formatDateTime(this.#text.getCreateAt());
    searchItemTextElem.innerHTML = highlightSearchWords(this.#text.getText(), this.#positions);    

    searchItemDisplayBtnElem.addEventListener('click', () => this.#renderEditorElem());
  }

  #renderEditorElem() {
    innsertText();
    document.getElementById('editor-textarea').value = this.#text.getText();
    updateContent();
    hideModal();
    hideOffcanvas();
  }

  getElem() { return this.#ELEM; }
}

const innsertText = async () => {
  const text = document.getElementById('editor-textarea').value;
  if (text === '' || text === undefined) {
    return;
  }

  const result = await textDB.selectAll();
  const exist = result.data.find(data => data.getText() === text);
  if (exist) {
    exist.setCreateAt(new Date());
    await textDB.update(exist.generateRow());
  } else {
    const t = new Text({ text: text, create_at: new Date() });
    await textDB.innsert(t.generateRow());
  }
}

const removeText = async (id) => {
  if (id === undefined) {
    return;
  }
  textDB.deleteById(id).then((resuponse) => {
    console.info(resuponse);
    setHistoryList();
  }).catch((resuponse) => {
    console.error(resuponse);
  })
}

const toggleAutoSave = (checked) => {
  isAutoSave = checked;
  const autoSaveIcon = document.getElementById('autoSaveIcon');
  if (isAutoSave) {
    autoSaveIcon.classList.add('text-success');
    autoSaveIcon.classList.remove('text-danger');
    autoSaveIcon.innerHTML = createIconElem('checked');
  } else {
    autoSaveIcon.classList.remove('text-success');
    autoSaveIcon.classList.add('text-danger');
    autoSaveIcon.innerHTML = createIconElem('unChecked');
  }
}

const setHistoryList = async () => {
  const historyListElem = document.getElementById('historyList');
  historyListElem.innerHTML = '';
  const result = await textDB.selectAll();
  texts = result.data;
  texts.sort((a, b) => b.getCreateAt() - a.getCreateAt()).forEach(text => {
    const historyItem = new HistoryItem(text);
    historyListElem.appendChild(historyItem.getElem());
  });
}

const updateContent = () => {
  duringInput();
  document.getElementById('preview-content').innerHTML = marked.parse(document.getElementById('editor-textarea').value);
  hljs.highlightAll();
}
const showEditor = () => {
  document.getElementById('editor').classList.remove('d-none');
  document.getElementById('editor').style.width = '100%';
  document.getElementById('preview').classList.add('d-none');
}
const showPreview = () => {
  document.getElementById('editor').classList.add('d-none');
  document.getElementById('preview').classList.remove('d-none');
}


// all word count
const duringInput = () => {
  let textarea = document.getElementById('editor-textarea').value;
  let count_num = document.getElementById('count_num');

  count_num.innerText = textarea.replace(/\s+/g, '').length;
  document.getElementById('clipboard-btn-svg').setAttribute('xlink:href', '#clipboard_default');
  isClipboardCheck = false;
}

// selection word count
document.onselectionchange = () => {
  let sel_text = document.getSelection().toString();
  let sel_count_num = document.getElementById('sel_count_num');

  sel_count_num.innerText = sel_text.replace(/\s+/g, '').length;
}

/**
 * apply MD format to editor
 * @param {SHORTCUT_OPTION} format 
 */
const formatting = (format) => {
  const textarea = document.getElementById('editor-textarea');
  const { value, selectionStart, selectionEnd } = textarea;

  textarea.value = format.func({
    beforeCursor: value.substring(0, selectionStart),
    select: value.substring(selectionStart, selectionEnd),
    afterCursor: value.substring(selectionEnd),
  });
  updateContent();
}

const getResponsiveWidth = () => {
  if (768 <= window.innerWidth) {
    return '75%';
  }
  return '100%';
}

const hideOffcanvas = () => document.getElementById('offcanvas-close').click();
const hideModal = () => document.getElementById('modal-close').click();
const showModal = () => document.getElementById('search-btn').click();

window.addEventListener('DOMContentLoaded', () => {
  
  updateContent();
  showEditor();

  document.getElementById('editOnly-btn').addEventListener('click', showEditor);
  document.getElementById('previewOnly-btn').addEventListener('click', showPreview);
  document.getElementById('editor-textarea').addEventListener('input', updateContent);
  document.getElementById('viewWidthRange').addEventListener('change', (e) => {
    document.getElementById('editor').classList.remove('d-none');
    document.getElementById('editor').style.width = `${e.target.value}%`;
    document.getElementById('preview').classList.remove('d-none');
  });

  document.getElementById('font_size_range').addEventListener('change', (e) => {
    document.getElementById('editor-textarea').style.fontSize = `${e.target.value}px`;
    document.getElementById('preview-content').style.fontSize = `${e.target.value}px`;
    document.getElementById('font_size_num').innerText = e.target.value;
  });

  document.getElementById('clipboard-btn').addEventListener('click', () => {
    if (!isClipboardCheck) {
      document.getElementById('clipboard-btn-svg').setAttribute('xlink:href', '#clipboard_check');
      document.getElementById('editor-textarea').select();
      document.execCommand('copy');
      isClipboardCheck = true;
    }
  });

  // dark mode
  const toggleDarkMode = (isDark = true) => {
    if (isDark) {
      document.getElementsByTagName('html')[0].setAttribute('data-bs-theme', 'dark');
      document.getElementById('darkmode-btn-svg').setAttribute('xlink:href', '#dark_mode');
    } else {
      document.getElementsByTagName('html')[0].setAttribute('data-bs-theme', 'light');
      document.getElementById('darkmode-btn-svg').setAttribute('xlink:href', '#light_mode');
    }
  }
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    toggleDarkMode();
  }
  document.getElementById('darkmode-btn').addEventListener('click', () => {
    toggleDarkMode(
      document.getElementById('darkmode-btn-svg').getAttribute('xlink:href') == '#dark_mode' ? false : true
    );
  });

  document.getElementById('save-btn').addEventListener('click', async () => {
    innsertText();
  });

  document.getElementById('menu-btn').addEventListener('click', async () => {
    document.getElementById('offcanvas').style.width = getResponsiveWidth();
    setHistoryList();
  });

  document.getElementById('autoSave').addEventListener('click', (e) => {
    toggleAutoSave(e.target.checked);
  });

  // search history
  document.getElementById('search-btn').addEventListener('click', (e) => {
    setHistoryList();
    setTimeout(() => document.getElementById('search-word').focus(), 500);
  });

  document.getElementById('search-item-display-close-btn').addEventListener('click', (e) => {
    const searchItemDetailElem = document.getElementById('search-item-detail');
    searchItemDetailElem.classList.add('d-none');
  });

  document.getElementById('search-word').addEventListener('input', (e) => {
    const { value } = e.target;
    if (value === '') return;

    const searchItemsElem = document.getElementById('search-items');
    const searchItemDetailElem = document.getElementById('search-item-detail');
    searchItemsElem.innerHTML = '';
    searchItemDetailElem.classList.add('d-none');

    const filteredText = texts.filter(text => text.getText().includes(value));
    if (filteredText.length === 0) {
      searchItemsElem.innerHTML = `<p class="text-center py-5">「${value}」に一致するデータは見つかりませんでした。</p>`;
    } else {
      filteredText.forEach(text => searchItemsElem.appendChild(new HistroyItemForSearch(text, value).getElem()));
    }
  });

  // auto save
  setInterval(() => {
    if (isAutoSave) {
      innsertText();
    }
  }, autoSaveInterval);
});

// perform a specific action when a shortcut key is pressed
document.addEventListener('keydown', (keyboardEvent) => {
  const shortcut = getShortcut(keyboardEvent);
  if (shortcut === null) {
    return;
  }

  if (!shortcut.isFormat) {
    shortcut.func();
    return;
  }

  formatting(shortcut);
});

// auto save when screen is closed
window.addEventListener('beforeunload', async (e) => {
  if (isAutoSave) {
    innsertText();
  }
});
