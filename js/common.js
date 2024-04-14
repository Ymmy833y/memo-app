
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
