# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MemoApp is a browser-based note-taking SPA using TOAST UI Editor (WYSIWYG Markdown). All data is stored client-side in IndexedDB with LZString compression. A Service Worker provides offline support. Deployed to GitHub Pages.

## Commands

- `npm start` - Dev server (Parcel with hot reload)
- `npm run build` - Production build to `public/`
- `npm test` - Run all tests (Vitest)
- `npm run test:watch` - Tests in watch mode
- `npm run test:coverage` - Tests with Istanbul coverage report
- `npx vitest run tests/db/MemoHeaderDB.test.ts` - Run a single test file
- `npm run lint` - ESLint check
- `npm run lint:fix` - ESLint auto-fix

## Architecture

### Data Layer (`src/db/`)

Two-table IndexedDB design with an abstract `BaseDB<T>` providing generic CRUD:
- **`memo_header`** - Memo metadata (id, title, created_at, updated_at)
- **`memo_content`** - Versioned compressed text (id, header_id, text, created_at)

Each content save creates a new version linked to its header via `header_id`, enabling version history. Text is compressed with LZString before storage.

### Models (`src/model/`)

Entity classes (`MemoHeader`, `MemoContent`) with static factory methods (`fromRow()`, `fromRequiredArgs()`). DTOs (`MemoDto`, `MemoContentDto`, `MemoSearchDto`) and converter functions handle data transfer between layers.

### Services (`src/service/`)

Each service is a module of exported functions (no classes):
- **`memo.ts`** - Core save/load logic with upsert pattern: matches by first-line title, deduplicates identical content
- **`editor.ts`** - TOAST UI Editor singleton lifecycle (create, update theme, load content)
- **`autoSave.ts`** - Periodic save with configurable interval, saves on `beforeunload`
- **`theme.ts`** - Dark/light mode via Tailwind `dark` class on `<html>`
- **`shortcut.ts`** - Keyboard shortcut registry (21 commands)
- **`memoSearch.ts`** - Full-text keyword search across all memo versions
- **`allMemos.ts`** - Sidebar memo list with CRUD operations
- **`memoHistory.ts`** - Version history modal
- **`migrate.ts`** - Database schema migration

### Entry Point

`src/index.ts` initializes IndexedDB, creates the editor, wires up all UI event listeners, and registers the Service Worker (`src/sw.ts`).

### Service Worker (`src/sw.ts`)

Cache name `memo-app-cache-v3`. Caches Parcel manifest assets on install. Uses network-first fetch strategy with cache fallback.

## Key Patterns

- **User config in localStorage**: theme (`editorTheme`), auto-save (`autoSaveEnabled`, `autoSaveInterval`), shortcuts (`shortcuts`)
- **Memo identification**: First non-empty line of editor content is used as the memo title
- **Content deduplication**: If latest stored content matches new text, only the timestamp is updated (no new version created)
- **Parcel bundle manifest**: `.parcelrc` uses `parcel-reporter-bundle-manifest` to generate `manifest.json` consumed by the Service Worker for cache registration

## Testing

- Vitest with jsdom environment and `fake-indexeddb` (auto-loaded in `tests/vitest.setup.ts`)
- Globals enabled: `describe`, `it`, `expect`, `vi` available without imports
- Tests mirror `src/` structure under `tests/`
- ESLint rules relaxed in test files for `@typescript-eslint/no-explicit-any` and unbound methods

## Tech Stack

- **Bundler**: Parcel 2.13.3 (pinned - `PARCEL_WORKER_BACKEND=process` needed in CI)
- **CSS**: Tailwind CSS 3.x with dark mode via `class` strategy
- **Editor**: TOAST UI Editor 3.x with color-syntax, code-syntax-highlight, and UML plugins
- **Language**: TypeScript (strict mode, target ES6)
- **Linting**: ESLint with typescript-eslint strict + stylistic configs (2-space indent, single quotes)
