/**
 * Retrieves the current theme from localStorage.
 * If not set, returns 'dark' or 'light' based on the browser's color scheme.
 * @returns {string} 'dark' or 'light'
 */
export const getCurrentTheme = () => {
  const storedTheme = localStorage.getItem('editorTheme');
  if (storedTheme) {
    return storedTheme;
  } else {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}

/**
 * Saves the given theme to localStorage.
 * @param {string} theme - 'dark' or 'light'
 */
export const setCurrentTheme = (theme: string) => {
  localStorage.setItem('editorTheme', theme);
}

/**
 * Toggles the theme between 'dark' and 'light'.
 * @returns {string} The new theme after toggling.
 */
export const toggleTheme = () => {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setCurrentTheme(newTheme);
  applyGlobalTheme(newTheme);
  return newTheme;
}

/**
 * Applies the given theme globally.
 * If the theme is 'dark', adds the 'dark' class to the <html> element;
 * otherwise, removes it.
 * This is useful for Tailwind CSS dark mode.
 * @param {string | undefined} theme - 'dark' or 'light' or undefined
 */
export const applyGlobalTheme = (theme?: string) => {
  if (!theme) {
    theme = getCurrentTheme();
  }

  const toggleThemeBtn = document.getElementById('toggle-theme') as HTMLButtonElement;
  const useElem = toggleThemeBtn.querySelector('svg use') as SVGUseElement;

  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    useElem.setAttribute('xlink:href', '#dark_mode');
  } else {
    document.documentElement.classList.remove('dark');
    useElem.setAttribute('xlink:href', '#light_mode');
  }
}
