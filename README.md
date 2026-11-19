# 🧠 Brain Valet — Note Taker

A local-first, Obsidian-style Markdown knowledge base that runs in the browser.
Your notes are plain `.md` files in a folder you control — no account, no cloud, no lock-in.

![stack](https://img.shields.io/badge/React_18-Vite_5-61dafb) 
## ✨ Features (Obsidian-inspired)

| Feature | Details |
| --- | --- |
| **Wikilinks** | `[[Note Name]]`, `[[Note\|alias]]`, `[[Note#heading]]`, embeds `![[Note]]`. Ctrl/Cmd+Click to follow; unresolved links offer to create the note. |
| **Backlinks panel** | Linked mentions with context, plus *unlinked mentions* of the note's name. |
| **Graph view** | Interactive force-directed canvas graph (d3-force). Zoom, pan, drag nodes, click to open; unresolved links appear as pink ghost nodes. |
| **Live editor** | CodeMirror 6 with Markdown syntax highlighting, styled wikilinks, line numbers, search (`Ctrl+F`), undo history. |
| **Reading view** | GFM preview via `marked` + DOMPurify — tables, task lists, code blocks, blockquotes. Toggle with `Ctrl/Cmd+E`. |
| **Vault on disk** | "Open folder" uses the File System Access API (Chrome/Edge) — edits autosave to real `.md` files and external changes are picked up. Falls back to localStorage elsewhere. |
| **Quick switcher** | `Ctrl/Cmd+O` fuzzy jump to (or create) any note, with full-text search results. |
| **Command palette** | `Ctrl/Cmd+P` for commands + search. |
| **Tabs & folders** | Multi-tab workspace, collapsible folder tree, rename (double-click / ✎), delete (right-click). |
| **Tags & outline** | Inline `#tags` and frontmatter `tags:` extracted automatically; heading outline per note. |

## ⌨️ Keyboard shortcuts

| Keys | Action |
| --- | --- |
| `Ctrl/Cmd + N` | New note |
| `Ctrl/Cmd + O` | Quick switcher |
| `Ctrl/Cmd + P` | Command palette |
| `` Ctrl/Cmd + ` `` | Toggle graph view |
| `Ctrl/Cmd + E` | Toggle edit / preview |
| `Ctrl/Cmd + Click` | Follow wikilink in editor |
| `Ctrl/Cmd + F` | In-editor search |

## 🚀 Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

Production build:

```bash
npm run build
npm run preview
```

Then either start writing (notes persist in browser storage), or click
**📂 Open folder** to point the app at a real directory of Markdown files
(e.g. an existing Obsidian vault!) and edit them directly on disk.

## 🗂 Project structure

```
src/
  main.jsx                 # entry
  App.jsx                  # layout shell, tabs, status bar, hotkeys
  styles.js                # Obsidian-like dark theme (Catppuccin palette)
  editor/MarkdownEditor.jsx# CodeMirror 6 integration + wikilink decorations
  components/
    FileExplorer.jsx       # folder tree, create/rename/delete
    EditorPane.jsx         # edit/preview toggle toolbar
    Preview.jsx            # rendered markdown, clickable internal links
    BacklinksPanel.jsx     # backlinks, unlinked mentions, outline, tags
    GraphView.jsx          # force-directed link graph (canvas)
    QuickSwitcher.jsx      # switcher + command palette modal
  vault/
    fsVault.js             # File System Access API layer + localStorage fallback
    VaultContext.jsx       # app state: files, tabs, graph, persistence
    seedNotes.js           # starter notes
  lib/
    linkGraph.js           # wikilink parsing, resolution, backlink graph, search
    markdown.js            # marked + DOMPurify rendering, headings
```

## ⚠️ Notes & limitations

- Disk-backed vaults require a Chromium browser (File System Access API). Other browsers get the localStorage fallback.
- This is an independent project inspired by Obsidian's UX; it is not affiliated with Obsidian. Images/PDF embeds and canvas are out of scope for now.
