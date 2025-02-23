# MemoApp

MemoApp is a web-based note-taking application that uses [Toast UI Editor](https://ui.toast.com/tui-editor) to create and edit memos. It supports both a WYSIWYG interface and markdown editing.

## Usage

- **Editor Functionality**  
  Utilizes Toast UI Editor as a WYSIWYG editor for creating and editing memos. The editor also supports markdown editing.

- **Dark Mode/Light Mode Switching**  
  Allows switching themes based on the browser's color scheme or user interaction.

- **Clipboard Save:**  
  Click the clipboard button to copy the entire content of the editor to your clipboard.

- **Manual Save:**  
  Click the save button to store the current editor content into IndexedDB.

- **Auto-Save:**  
  Toggle auto-save on or off using the Auto Save button. When enabled, the application automatically saves your memo to IndexedDB at a user-configurable interval (default is 180 seconds) and on page unload.

- **Search:**  
  Open the search modal from the side menu to search through your saved memos.
