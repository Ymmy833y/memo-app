
const countAsterisk = (str, isReverse = false) => {
  if (isReverse) str = str.split('').reverse().join('');

  const match = str.match(/^\*+/);
  return match ? match[0].length : 0;
}

const countWave = (str, isReverse = false) => {
  if (isReverse) str = str.split('').reverse().join('');

  const match = str.match(/^\~+/);
  return match ? match[0].length : 0;
}

const countBackquote = (str, isReverse = false) => {
  if (isReverse) str = str.split('').reverse().join('');

  const match = str.match(/^\`+/);
  return match ? match[0].length : 0;
}

const getLastLn = (str) => {
  const index = str.lastIndexOf('\n');
  if (index < 0) return 0;
  return index + 1;
}

const startWithDasy = (str) => {
  return /^(\s)*-/.test(str);
}

const createIconElem = (id) => {
  return `<svg class="bi" width="20" height="20" fill="currentColor"><use xlink:href="#${id}"></use></svg>`
}

const zeroPadding = (num) => {
  return ('00' + num).slice(-2);
}

const formatDateTime = (dateTime) => {
  const d = new Date(dateTime);
  return `${zeroPadding(d.getMonth()+1)}/${zeroPadding(d.getDate())} ${zeroPadding(d.getHours())}:${zeroPadding(d.getMinutes())}`;
}

const truncateAfterFifthNewline = (str) => {
  let newlineCount = 0;
  let position = 0;

  while (newlineCount < 5 && position !== -1) {
    position = str.indexOf('\n', position);
    if (position !== -1) {
      newlineCount++;
      position++;
    }
  }
  if (newlineCount >= 5) {
    return str.substring(0, position - 1) + "\n...";
  }

  return str;
}

const findAllOccurrences = (text, searchString) => {
  const positions = [];
  const regex = new RegExp(searchString, 'g');
  let match;
  while ((match = regex.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    positions.push({ start, end });
  }

  return positions;
}

/**
 * @param {String} text 
 * @param {{start: Number, end: Number}} searchResult 
 * @returns 
 */
const getLinePosition = (text, searchResult) => {
  const { start, end } = searchResult;
  const startOfLine = text.lastIndexOf('\n', start) + 1;
  const endOfLine = text.indexOf('\n', end);
  
  return { startOfLine, endOfLine: endOfLine === -1 ? text.length : endOfLine };
}

/**
 * @param {String} text 
 * @param {{start: Number, end: Number}[]} searchResults 
 * @returns 
 */
const highlightSearchWords = (text, searchResults) => {
  searchResults.sort((a, b) => b.start - a.start);
  searchResults.forEach(result => {
    const { start, end } = result;
    text = text.slice(0, start) +`<span class="search-word">` + 
      text.slice(start, end) + `</span>` + 
      text.slice(end);
  });

  return text.replace(/\n/g, '<br>');
}
