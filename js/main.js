
const textDB = new TextDB;
new IndexedDB().initDB([textDB.setUpDB()]);

const FONT_FAMILY = {
  Mincho: ['Yu Mincho Light', 'YuMincho', 'Yu Mincho', '貂ｸ譏取悃菴 ', 'sans-serif'],
  Gothic: ["YuGothic", 'Yu Gothic', 'sans-serif'],
  Cursive: ["SimSun", 'Kaiti SC', 'sans-serif'],
}
let isClipboardCheck = false;
let isAutoSave = true;

class HistoryItem {
  #ELEM;
  #text;
  /**
   * @param {Text} text 
   */
  constructor(text) {
    this.#ELEM = document.createElement("li");
    this.#text = text;

    this.#createElem();
  }

  #createElem = () => {
    this.#ELEM.classList.add("list-group-item");
    const row = document.createElement("div");
    row.classList.add("row");
    const contentForDate = document.createElement("div");
    contentForDate.classList.add("col-2");
    contentForDate.innerText = formatDateTime(this.#text.getCreateAt());
    const contentForText = document.createElement("div");
    contentForText.classList.add("col-9", "historyItem");
    contentForText.innerText = this.#text.getText();
    const contentForFunc = document.createElement("div");
    contentForFunc.classList.add("col-1");
    const displayBtn = document.createElement("button");
    displayBtn.classList.add("btn", "btn-outline-secondary", "w-100", "mb-1");
    displayBtn.innerText = "表示";
    contentForFunc.appendChild(displayBtn);
    const removeBtn = document.createElement("button");
    removeBtn.classList.add("btn", "btn-outline-danger", "w-100");
    removeBtn.innerText = "削除";
    contentForFunc.appendChild(removeBtn);

    row.appendChild(contentForDate);
    row.appendChild(contentForText);
    row.appendChild(contentForFunc);
    this.#ELEM.appendChild(row);

    displayBtn.addEventListener("click", () => {
      innsertText();
      document.getElementById("textarea").value = this.#text.getText();
    });
    removeBtn.addEventListener("click", () => {
      removeText(this.#text.getId());
    })
  }

  getElem = () => { return this.#ELEM }
}

const formatDateTime = (dateTime) => {
  const d = new Date(dateTime);
  return `${zeroPadding(d.getMonth()+1)}-${zeroPadding(d.getDate())} ${zeroPadding(d.getHours())}:${zeroPadding(d.getMinutes())}`;
}
const zeroPadding = (num) => {
  return ('00' + num).slice(-2);
}

// all word count
const duringInput = () => {
  let textarea = document.getElementById("textarea").value;
  let count_num = document.getElementById("count_num");

  count_num.innerText = textarea.replace(/\s+/g, '').length;
  document.getElementById('clipboard-btn-svg').setAttribute("xlink:href", "#clipboard_default");
  isClipboardCheck = false;
}

const innsertText = async () => {
  const text = document.getElementById('textarea').value;
  if (text === "" || text === undefined) {
    return;
  }

  const result = await textDB.selectAll();
  if (result.data.length === 0 || text !== result.data[result.data.length - 1].getText()) {
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

const createIconElem = (id) => {
  return `<svg width="20" height="20" fill="currentColor"><use xlink:href="#${id}"></use></svg>`
}
const toggleAutoSave = (checked) => {
  isAutoSave = checked;
  const autoSaveIcon = document.getElementById("autoSaveIcon");
  if (isAutoSave) {
    autoSaveIcon.classList.add("text-success");
    autoSaveIcon.classList.remove("text-danger");
    autoSaveIcon.innerHTML = createIconElem("checked");
  } else {
    autoSaveIcon.classList.remove("text-success");
    autoSaveIcon.classList.add("text-danger");
    autoSaveIcon.innerHTML = createIconElem("unChecked");
  }
}

const setHistoryList = async () => {
  const historyListElem = document.getElementById("historyList");
  historyListElem.innerHTML = "";
  const result = await textDB.selectAll();
  result.data.sort((a, b) => b.getCreateAt() - a.getCreateAt()).forEach(text => {
    const historyItem = new HistoryItem(text);
    historyListElem.appendChild(historyItem.getElem());
  });
}

// selection word count
document.onselectionchange = () => {
  let sel_text = document.getSelection().toString();
  let sel_count_num = document.getElementById("sel_count_num");

  sel_count_num.innerText = sel_text.replace(/\s+/g, '').length;
}

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("font_size_range").addEventListener('input', (e) => {
    $("textarea").css("fontSize", String(e.target.value) + "px");
    document.getElementById("font_size_num").innerText = e.target.value;
  });

  document.getElementById("clipboard-btn").addEventListener('click', () => {
    if (!isClipboardCheck) {
      document.getElementById('clipboard-btn-svg').setAttribute("xlink:href", "#clipboard_check");
      document.getElementById('textarea').select();
      document.execCommand("copy");
      isClipboardCheck = true;
    }
  });

  // dark mode
  const toggleDarkMode = (isDark = true) => {
    if (isDark) {
      document.getElementsByTagName("html")[0].setAttribute("data-bs-theme", "dark");
      document.getElementById('darkmode-btn-svg').setAttribute("xlink:href", "#dark_mode");
    } else {
      document.getElementsByTagName("html")[0].setAttribute("data-bs-theme", "light");
      document.getElementById('darkmode-btn-svg').setAttribute("xlink:href", "#light_mode");
    }
  }
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    toggleDarkMode();
  }
  document.getElementById('darkmode-btn').addEventListener('click', () => {
    toggleDarkMode(
      document.getElementById('darkmode-btn-svg').getAttribute("xlink:href") == "#dark_mode" ? false : true
    );
  });

  document.getElementById("menu-btn").addEventListener("click", async () => {
    setHistoryList();
  });

  document.getElementById("autoSave").addEventListener("click", (e) => {
    toggleAutoSave(e.target.checked);
  })

  // 3m毎に自動保存
  setInterval(() => {
    if (isAutoSave) {
      innsertText();
    }
  }, 180000);
});

window.addEventListener("beforeunload", async (e) => {
  if (isAutoSave) {
    innsertText();
  }
});
