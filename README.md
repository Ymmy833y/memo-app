# MemoApp v2.0.0-alpha3

MemoApp is a lightweight note-taking application that allows you to create and manage memos using a rich Markdown editor directly in your browser.

<div style="margin-bottom: 20px;">
  <a href="https://ymmy833y.github.io/memo-app/" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: #fff; font-size: 18px; font-weight: bold; text-decoration: none; border-radius: 8px;">
    ▶️ View MemoApp
  </a>
</div>

## Features

* **Rich Markdown Editor** – Enhanced editing experience with a WYSIWYG Markdown editor (Toast UI Editor) plus additional plugins.
* **Auto Save** – Automatically saves your notes at regular intervals to prevent data loss.
* **Quick Search** – Find your memos quickly using a built-in search modal interface.
* **Keyboard Shortcuts** – Comprehensive hotkeys for a variety of editing commands.
* **Offline Functionality** – After an initial network connection, essential resource files are cached locally, allowing memo editing even when the network is unavailable.

## Characteristics

* **Rich Markdown Editor:** The app features an enhanced Markdown editor powered by TOAST UI Editor. It supports extended syntax through additional plugins, including a Color Syntax plugin for text styling, a UML plugin for rendering UML diagrams, and a Code Syntax Highlight plugin for syntax-highlighted code blocks. This provides a rich editing experience where you can format text, insert code with highlighting, and even draw diagrams within your notes.
* **Auto Save:** Your edits are automatically saved at a set interval so you never lose progress. In v2.0.0-alpha3, a user interface has been added to adjust the auto-save interval. You can customize how frequently the app saves your work (for example, every 30 seconds or 1 minute) to suit your needs.
* **Quick Search:** MemoApp includes a search modal that lets you quickly find content across all your memos. By typing keywords, you can filter through your notes to locate specific information. The search opens in a modal window for convenience and can be toggled easily.
* **Keyboard Shortcuts:** To boost productivity, MemoApp supports a comprehensive set of keyboard shortcuts for various formatting and editing commands, allowing fast interaction without relying on the mouse.
* **Offline Functionality:** MemoApp requires an initial network connection to download and cache its resource files. Once cached, the app can function without continuous connectivity; however, not all features may be available when offline.
* **Dark Mode/Light Mode Switching:** The application allows switching themes based on the browser's color scheme or via user interaction, ensuring comfortable reading in various lighting conditions.
* **Clipboard Save:** A clipboard button is provided to quickly copy the entire content of the editor to your clipboard, facilitating easy sharing or backup of your notes.

## Shortcut Keys

| Command         | Default Shortcut     | Description                                         |
|-----------------|----------------------|-----------------------------------------------------|
| header1         | Ctrl+Alt+1           | Apply Heading Level 1                               |
| header2         | Ctrl+Alt+2           | Apply Heading Level 2                               |
| header3         | Ctrl+Alt+3           | Apply Heading Level 3                               |
| header4         | Ctrl+Alt+4           | Apply Heading Level 4                               |
| header5         | Ctrl+Alt+5           | Apply Heading Level 5                               |
| header6         | Ctrl+Alt+6           | Apply Heading Level 6                               |
| paragraph       | Ctrl+Alt+0           | Set text as paragraph (remove heading)              |
| bold            | Ctrl+B               | Toggle bold formatting                              |
| italic          | Ctrl+I               | Toggle italic formatting                            |
| strike          | Ctrl+S               | Toggle strikethrough formatting                     |
| quote           | Ctrl+Shift+Q         | Toggle blockquote formatting                        |
| bulletList      | Ctrl+U               | Toggle unordered (bullet) list formatting           |
| orderedList     | Ctrl+O               | Toggle ordered list formatting                      |
| taskList        | Ctrl+Alt+T           | Toggle task list formatting                         |
| inlineCode      | Ctrl+Shift+C         | Toggle inline code formatting                       |
| codeBlock       | Ctrl+Shift+Alt+C     | Toggle code block formatting                        |
| horizontalRule  | Ctrl+L               | Insert a horizontal rule                            |
| saveText        | Ctrl+Shift+S         | Save text to IndexedDB                              |
| showSearchModal | Ctrl+Shift+F         | Display the search modal window                     |
| Clipboard Copy  | Ctrl+Alt+C           | Copy the current Markdown content to your clipboard |
| clearStyle      | Ctrl+Alt+X           | Remove all styles from the editor                   |
