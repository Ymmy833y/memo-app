import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../src/db', () => ({
  initDatabase: vi.fn(() => Promise.resolve()),
}));

vi.mock('../src/service/memo', () => ({
  saveMemo: vi.fn(() => Promise.resolve()),
}));

vi.mock('../src/service/editor', () => ({
  copyMarkdownText: vi.fn(() => Promise.resolve()),
  createEditor: vi.fn(),
  updateEditor: vi.fn(),
}));

vi.mock('../src/service/theme', () => ({
  applyGlobalTheme: vi.fn(),
  toggleTheme: vi.fn(() => 'light'),
}));

vi.mock('../src/service/autoSave', () => ({
  initializeAutoSave: vi.fn(),
  toggleAutoSave: vi.fn(),
  changeAutoSaveInterval: vi.fn(),
}));

vi.mock('../src/service/allMemos', () => ({
  renderAllMemos: vi.fn(),
}));

vi.mock('../src/service/memoSearch', () => ({
  renderMemoSearch: vi.fn(),
}));

vi.mock('../src/service/shortcut', () => ({
  initializeShortcuts: vi.fn(),
}));

vi.mock('../src/service/migrate', () => ({
  migrateOldDB: vi.fn(),
}));

vi.mock('../src/util', () => ({
  hideSearchModal: vi.fn(),
  hideSideMenu: vi.fn(),
  setClipboardIcon: vi.fn(),
  setSaveIcon: vi.fn(),
}));

describe('Index module', () => {
  beforeEach(() => {
    // Reset module registry and set up DOM fixture
    vi.resetModules();

    document.body.innerHTML = `
      <button id="clipboard-btn"></button>
      <button id="save-btn"></button>
      <button id="menu-btn"></button>
      <div id="side-menu" class="translate-x-full"></div>
      <button id="close-menu-btn"></button>
      <button id="search-btn"></button>
      <div id="search-modal" class="hidden"></div>
      <button id="close-search-btn"></button>
      <button id="toggle-theme"></button>
      <button id="auto-save-btn"></button>
      <select id="auto-save-interval"></select>
      <input id="search-keyword" type="text" />
    `;
    // Append case-sensitive checkbox inside a label
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.id = 'search-case-sensitive';
    checkbox.type = 'checkbox';
    label.appendChild(checkbox);
    document.body.appendChild(label);

    // Mock the Service Worker API
    (globalThis.navigator as any).serviceWorker = {
      register: vi.fn(() => Promise.resolve({ scope: 'test-scope' })),
    };
  });

  afterEach(() => {
    // Clear all mocks and clean up DOM
    vi.clearAllMocks();
    document.body.innerHTML = '';
    delete (globalThis.navigator as any).serviceWorker;
  });

  it('should call initialization functions', async () => {
    const { initDatabase } = await import('../src/db');
    const themeMod = await import('../src/service/theme');
    const editorMod = await import('../src/service/editor');
    const autoSaveMod = await import('../src/service/autoSave');
    const shortcutMod = await import('../src/service/shortcut');
    const migrateMod = await import('../src/service/migrate');

    // Load and execute index.ts
    await import('../src/index');
    // Wait for initDatabase → main → migrateOldDB
    await Promise.resolve();

    expect(initDatabase).toHaveBeenCalled();
    expect(themeMod.applyGlobalTheme).toHaveBeenCalled();
    expect(editorMod.createEditor).toHaveBeenCalled();
    expect(autoSaveMod.initializeAutoSave).toHaveBeenCalled();
    expect(shortcutMod.initializeShortcuts).toHaveBeenCalled();
    expect(migrateMod.migrateOldDB).toHaveBeenCalled();
  });

  it('should handle button clicks and event listeners correctly', async () => {
    const memoMod = await import('../src/service/memo');
    const editorMod = await import('../src/service/editor');
    const allMemosMod = await import('../src/service/allMemos');
    const memoSearchMod = await import('../src/service/memoSearch');
    const utilMod = await import('../src/util');
    const themeMod = await import('../src/service/theme');
    const autoSaveMod = await import('../src/service/autoSave');

    await import('../src/index');
    await Promise.resolve();

    // Clipboard copy button
    document.getElementById('clipboard-btn')!.click();
    expect(editorMod.copyMarkdownText).toHaveBeenCalled();

    // Save button
    document.getElementById('save-btn')!.click();
    expect(memoMod.saveMemo).toHaveBeenCalled();

    // Menu toggle button
    document.getElementById('menu-btn')!.click();
    const sideMenu = document.getElementById('side-menu')!;
    expect(sideMenu.classList.contains('translate-x-full')).toBe(false);
    expect(allMemosMod.renderAllMemos).toHaveBeenCalled();

    // Close menu button
    document.getElementById('close-menu-btn')!.click();
    expect(utilMod.hideSideMenu).toHaveBeenCalled();

    // Show search modal
    document.getElementById('search-btn')!.click();
    const searchModal = document.getElementById('search-modal')!;
    expect(searchModal.classList.contains('hidden')).toBe(false);

    // Close search modal
    document.getElementById('close-search-btn')!.click();
    expect(utilMod.hideSearchModal).toHaveBeenCalled();

    // Theme toggle button
    document.getElementById('toggle-theme')!.click();
    expect(themeMod.toggleTheme).toHaveBeenCalled();
    expect(themeMod.applyGlobalTheme).toHaveBeenLastCalledWith('light');
    expect(editorMod.updateEditor).toHaveBeenCalled();

    // Auto-save toggle button
    document.getElementById('auto-save-btn')!.click();
    expect(autoSaveMod.toggleAutoSave).toHaveBeenCalled();

    // Auto-save interval change
    document
      .getElementById('auto-save-interval')!
      .dispatchEvent(new Event('change'));
    expect(autoSaveMod.changeAutoSaveInterval).toHaveBeenCalled();

    // Search keyword input
    const kw = document.getElementById('search-keyword') as HTMLInputElement;
    const cb = document.getElementById(
      'search-case-sensitive'
    ) as HTMLInputElement;
    kw.value = 'foo';
    kw.dispatchEvent(new Event('input'));
    expect(memoSearchMod.renderMemoSearch).toHaveBeenCalledWith('foo', false);

    // Case-sensitive checkbox toggle
    cb.checked = true;
    cb.dispatchEvent(new Event('click'));
    expect(memoSearchMod.renderMemoSearch).toHaveBeenCalledWith('foo', true);

    // Selection change event
    document.dispatchEvent(new Event('selectionchange'));
    expect(utilMod.setClipboardIcon).toHaveBeenCalledWith('default');
    expect(utilMod.setSaveIcon).toHaveBeenCalledWith('default');
  });

  it('should register the Service Worker on window load', async () => {
    await import('../src/index');
    await Promise.resolve();

    // Trigger window 'load' event
    window.dispatchEvent(new Event('load'));
    expect(navigator.serviceWorker!.register).toHaveBeenCalled();
  });
});
