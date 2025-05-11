# MemoApp v3.0.0-alpha1

MemoApp is a robust note-taking application that allows you to create and manage memos using a rich Markdown editor directly in your browser.

<div style="margin-bottom: 20px;">
  <a href="https://ymmy833y.github.io/memo-app/" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: #fff; font-size: 18px; font-weight: bold; text-decoration: none; border-radius: 8px;">
    ▶️ View MemoApp
  </a>
</div>

## Features

* **Rich Markdown Editor** – Enjoy an enhanced editing experience with a WYSIWYG Markdown editor powered by TOAST UI Editor along with additional plugins (Color Syntax, UML, and Code Syntax Highlight).
* **Auto Save** – Your notes are automatically saved at regular intervals to prevent data loss. The auto-save interval is adjustable via the user interface.
* **Memo Database Persistence** – All memos are stored persistently using IndexedDB. The app uses an upsert mechanism: if a memo already exists (an exact text match or with the same first-line title), its timestamp is updated and the new version is stored as part of the memo’s history; otherwise, a new record is inserted.
* **Quick Search** – Find your memos quickly using the built-in search modal. The search functionality extracts a snippet from each memo to help you locate the desired content with ease.
* **Keyboard Shortcuts** – Boost your productivity with a comprehensive set of keyboard shortcuts for various formatting and editing commands.
* **Offline Functionality** – After the initial network connection, essential resources are cached locally. This allows you to edit your memos even without continuous connectivity.
* **Dark Mode/Light Mode Switching** – Switch themes easily based on your preference or your browser’s color scheme.
* **Clipboard Copy** – A dedicated button lets you quickly copy your entire Markdown content to your clipboard for easy sharing or backup.

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
