import { createEditor, updateEditor } from './editor.js';
import { getCurrentTheme, toggleStoredTheme, applyGlobalTheme } from './utils/theme.js';

// On initial load, get the theme from storage or browser settings and apply it globally
const initialTheme = getCurrentTheme();
applyGlobalTheme(initialTheme);

// Initialize the editor with the current theme and dynamic height
createEditor();

// Set up the click event for the theme toggle button
document.getElementById('toggle-theme').addEventListener('click', () => {
  const newTheme = toggleStoredTheme();
  applyGlobalTheme(newTheme);
  updateEditor();
  console.log(`Theme switched to: ${newTheme}`);
});

// Listen for window resize events and update the editor's height accordingly
window.addEventListener('resize', () => {
  updateEditor();
});
