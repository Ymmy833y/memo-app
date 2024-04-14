
const formatToBold = ({ beforeCursor, select, afterCursor }) => {
  const beforeAsterisk = countAsterisk(beforeCursor.slice(-3), true);
  const afterAsterisk = countAsterisk(afterCursor.slice(0, 3));

  if ((beforeAsterisk === 2) && (afterAsterisk === 2)) {
    return beforeCursor.slice(0, -2) + select + afterCursor.slice(2);
  }
  return beforeCursor + '**' + select + '**' + afterCursor;
}

const formatToItalic = ({ beforeCursor, select, afterCursor }) => {
  const beforeAsterisk = countAsterisk(beforeCursor.slice(-3), true);
  const afterAsterisk = countAsterisk(afterCursor.slice(0, 3));

  if ((beforeAsterisk % 2 === 1) && (afterAsterisk % 2 === 1)) {
    return beforeCursor.slice(0, -1) + select + afterCursor.slice(1);
  }
  return beforeCursor + '*' + select + '*' + afterCursor;
}

const formatToStrikethrough = ({ beforeCursor, select, afterCursor }) => {
  const beforeAsterisk = countWave(beforeCursor.slice(-3), true);
  const afterAsterisk = countWave(afterCursor.slice(0, 3));

  if ((beforeAsterisk % 2 === 1) && (afterAsterisk % 2 === 1)) {
    return beforeCursor.slice(0, -1) + select + afterCursor.slice(1);
  }
  return beforeCursor + '~' + select + '~' + afterCursor;
}

const formatToQuote = ({ beforeCursor, select, afterCursor }) => {  
  const firstLnIndex = getLastLn(beforeCursor);
  return beforeCursor.slice(0, firstLnIndex) + '> ' + beforeCursor.slice(firstLnIndex) 
    + select.split('\n').join('\n> ')+ afterCursor;
}

const formatToCode = ({ beforeCursor, select, afterCursor }) => {
  const beforeAsterisk = countBackquote(beforeCursor.slice(-3), true);
  const afterAsterisk = countBackquote(afterCursor.slice(0, 3));

  if ((beforeAsterisk === 1) && (afterAsterisk === 1)) {
    return beforeCursor.slice(0, -1) + select + afterCursor.slice(1);
  }
  return beforeCursor + '`' + select + '`' + afterCursor;
}

const formatToCodeBlock = ({ beforeCursor, select, afterCursor }) => {
  return beforeCursor + '```\n' + select + '\n```' + afterCursor;
}

const FORMAT_DEFAULT_OPTION = {
  bold: { ctrl: true, shift: false, alt: false, keyCode: 'KeyB', format: formatToBold },
  italic: { ctrl: true, shift: false, alt: false, keyCode: 'KeyI', format: formatToItalic },
  strikethrough: { ctrl: true, shift: true, alt: false, keyCode: 'KeyX', format: formatToStrikethrough },
  quote: { ctrl: true, shift: true, alt: false, keyCode: 'Digit9', format: formatToQuote },
  code: { ctrl: true, shift: true, alt: false, keyCode: 'KeyC', format: formatToCode },
  codeBlock: { ctrl: true, shift: true, alt: true, keyCode: 'KeyC', format: formatToCodeBlock },
  // unorderedList: { ctrl: true, shift: true, alt: false, keyCode: 'Digit8' },
  // orderedList: { ctrl: true, shift: true, alt: false, keyCode: 'Digit7' },
};

/**
 * get FORMAT_DEFAULT_OPTION 
 * @param {KeyboardEvent} keyboardEvent 
 * @returns {@link FORMAT_DEFAULT_OPTION} || null
 */
const getFormat = (keyboardEvent) => {
  if (!keyboardEvent instanceof KeyboardEvent) {
    return null;
  }

  const { ctrlKey, shiftKey, altKey, code } = keyboardEvent;

  for (const [format, option] of Object.entries(FORMAT_DEFAULT_OPTION)) {
    const { ctrl, shift, alt, keyCode } = option;
    if (
      ctrl === ctrlKey &&
      shift === shiftKey &&
      alt === altKey &&
      keyCode === code
    ) {
      return FORMAT_DEFAULT_OPTION[format];
    }
  }

  return null;
};
