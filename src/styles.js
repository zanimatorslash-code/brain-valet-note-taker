// Obsidian-style dark theme CSS variables + layout.

export const themeCss = `
:root {
  --bg-primary: #1e1e2e;
  --bg-secondary: #181825;
  --bg-tertiary: #11111b;
  --bg-hover: #313244;
  --bg-active: #45475a;
  --text-normal: #cdd6f4;
  --text-muted: #a6adc8;
  --text-faint: #6c7086;
  --accent: #89b4fa;
  --accent-dim: #b4befe;
  --link-unresolved: #f38ba8;
  --border: #313244;
  --code-bg: #11111b;
  --font-ui: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: "SF Mono", "Cascadia Code", "Fira Code", Consolas, monospace;
}
* { box-sizing: border-box; }
html, body, #root { height: 100%; margin: 0; }
body {
  font-family: var(--font-ui);
  background: var(--bg-primary);
  color: var(--text-normal);
  overflow: hidden;
}
button { font-family: inherit; }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: var(--bg-active); border-radius: 4px; }
::-webkit-scrollbar-track { background: transparent; }
`;

export const appCss = `
.app-shell { display: flex; flex-direction: column; height: 100vh; }
.titlebar {
  display: flex; align-items: center; gap: 8px;
  height: 38px; padding: 0 10px;
  background: var(--bg-tertiary); border-bottom: 1px solid var(--border);
  -webkit-app-region: drag; user-select: none; flex-shrink: 0;
}
.titlebar .logo { color: var(--accent-dim); font-weight: 700; letter-spacing: .3px; font-size: 13px; display:flex; align-items:center; gap:6px;}
.titlebar .spacer { flex: 1; }
.titlebar button, .statusbar, .workspace { -webkit-app-region: no-drag; }

.main-row { display: flex; flex: 1; min-height: 0; }

/* Left sidebar */
.sidebar-left {
  width: 260px; min-width: 180px; background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column; flex-shrink: 0;
}
.sidebar-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px; font-size: 12px; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: .5px;
}
.icon-btn {
  background: none; border: none; color: var(--text-muted); cursor: pointer;
  border-radius: 5px; padding: 3px 6px; font-size: 14px; line-height: 1;
}
.icon-btn:hover { background: var(--bg-hover); color: var(--text-normal); }
.file-tree { flex: 1; overflow-y: auto; padding: 0 6px 12px; font-size: 13.5px; }
.tree-item {
  display: flex; align-items: center; gap: 6px; padding: 3px 8px;
  border-radius: 5px; cursor: pointer; color: var(--text-normal);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; user-select: none;
}
.tree-item:hover { background: var(--bg-hover); }
.tree-item.active { background: var(--bg-active); color: #fff; }
.tree-item .chevron { width: 12px; color: var(--text-faint); flex-shrink: 0; font-size: 10px; }
.tree-item.folder { color: var(--text-muted); }
.tree-children { margin-left: 10px; border-left: 1px solid var(--border); padding-left: 2px; }

/* Workspace / tabs */
.workspace { flex: 1; display: flex; flex-direction: column; min-width: 0; background: var(--bg-primary); }
.tabbar {
  display: flex; align-items: stretch; background: var(--bg-secondary);
  border-bottom: 1px solid var(--border); overflow-x: auto; min-height: 36px; flex-shrink: 0;
}
.tab {
  display: flex; align-items: center; gap: 6px; padding: 0 10px;
  font-size: 13px; color: var(--text-muted); cursor: pointer;
  border-right: 1px solid var(--border); white-space: nowrap; max-width: 220px;
}
.tab:hover { background: var(--bg-hover); }
.tab.active { background: var(--bg-primary); color: var(--text-normal); box-shadow: inset 0 2px 0 var(--accent); }
.tab .tab-title { overflow: hidden; text-overflow: ellipsis; }
.tab .close { border: none; background: none; color: var(--text-faint); cursor: pointer; padding: 2px 4px; border-radius: 4px; }
.tab .close:hover { background: var(--bg-active); color: var(--text-normal); }
.tab-add { border: none; background: none; color: var(--text-faint); cursor: pointer; padding: 0 12px; font-size: 16px; }
.tab-add:hover { color: var(--text-normal); background: var(--bg-hover); }

.pane-toolbar {
  display: flex; align-items: center; gap: 6px; padding: 6px 12px;
  border-bottom: 1px solid var(--border); font-size: 12px; color: var(--text-faint); flex-shrink: 0;
}
.pane-toolbar .path { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mode-toggle { display: flex; gap: 2px; background: var(--bg-tertiary); border-radius: 6px; padding: 2px; }
.mode-toggle button {
  border: none; background: none; color: var(--text-muted); cursor: pointer;
  padding: 3px 10px; border-radius: 4px; font-size: 12px;
}
.mode-toggle button.on { background: var(--bg-active); color: var(--text-normal); }

.editor-area { flex: 1; min-height: 0; position: relative; overflow: hidden; }
.cm-host { position: absolute; inset: 0; }
.cm-host .cm-editor { height: 100%; background: transparent; }
.cm-host .cm-scroller { font-family: var(--font-mono); font-size: 14.5px; line-height: 1.65; padding: 8px 0 40vh; }
.cm-host .cm-content { caret-color: var(--accent); max-width: 760px; margin: 0 auto; padding: 0 24px; }
.cm-host .cm-gutters { background: transparent; border: none; color: var(--text-faint); }
.cm-host .cm-activeLine { background: rgba(137,180,250,.05); }
.cm-host .cm-activeLineGutter { background: transparent; }

/* Preview */
.preview { position: absolute; inset: 0; overflow-y: auto; }
.markdown-body { max-width: 760px; margin: 0 auto; padding: 24px 24px 40vh; font-size: 16px; line-height: 1.7; }
.markdown-body h1, .markdown-body h2, .markdown-body h3 { font-weight: 650; line-height: 1.3; margin: 1.4em 0 .5em; }
.markdown-body h1 { font-size: 1.9em; border-bottom: 1px solid var(--border); padding-bottom: .25em; }
.markdown-body h2 { font-size: 1.45em; border-bottom: 1px solid var(--border); padding-bottom: .2em; }
.markdown-body a { color: var(--accent); text-decoration: none; }
.markdown-body a:hover { text-decoration: underline; }
.markdown-body a.internal-link { color: var(--accent); }
.markdown-body a.internal-link.unresolved { color: var(--link-unresolved); }
.markdown-body code { background: var(--code-bg); padding: 2px 5px; border-radius: 4px; font-family: var(--font-mono); font-size: .88em; }
.markdown-body pre { background: var(--code-bg); padding: 14px; border-radius: 8px; overflow-x: auto; border: 1px solid var(--border); }
.markdown-body pre code { background: none; padding: 0; }
.markdown-body blockquote { margin: 0; padding: 2px 16px; border-left: 3px solid var(--accent-dim); color: var(--text-muted); background: rgba(180,190,254,.05); border-radius: 0 6px 6px 0; }
.markdown-body table { border-collapse: collapse; margin: 1em 0; }
.markdown-body th, .markdown-body td { border: 1px solid var(--border); padding: 6px 12px; }
.markdown-body th { background: var(--bg-secondary); }
.markdown-body img { max-width: 100%; border-radius: 8px; }
.markdown-body hr { border: none; border-top: 1px solid var(--border); margin: 2em 0; }
.markdown-body input[type=checkbox] { accent-color: var(--accent); margin-right: 6px; }
.transclusion { color: var(--accent-dim); background: var(--bg-hover); padding: 1px 6px; border-radius: 4px; font-size: .9em; cursor: pointer; }

/* Right sidebar */
.sidebar-right {
  width: 280px; min-width: 200px; background: var(--bg-secondary);
  border-left: 1px solid var(--border); overflow-y: auto; flex-shrink: 0;
  padding: 10px 12px; font-size: 13px;
}
.panel-title { font-size: 11px; text-transform: uppercase; letter-spacing: .6px; color: var(--text-faint); margin: 14px 0 6px; display:flex; justify-content:space-between; align-items:center;}
.backlink-item { padding: 6px 8px; border-radius: 6px; cursor: pointer; margin-bottom: 4px; background: var(--bg-primary); border: 1px solid var(--border); }
.backlink-item:hover { border-color: var(--accent); }
.backlink-item .bl-title { color: var(--accent); font-weight: 600; margin-bottom: 2px; }
.backlink-item .bl-ctx { color: var(--text-muted); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.outline-item { padding: 3px 6px; border-radius: 5px; cursor: pointer; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.outline-item:hover { background: var(--bg-hover); color: var(--text-normal); }
.tag-chip { display: inline-block; background: var(--bg-hover); color: var(--accent-dim); border-radius: 10px; padding: 1px 9px; margin: 2px; font-size: 12px; cursor: pointer; }
.tag-chip:hover { background: var(--bg-active); }
.meta-row { display: flex; justify-content: space-between; color: var(--text-faint); font-size: 12px; padding: 2px 0; }

/* Graph view */
.graph-view { position: absolute; inset: 0; background: var(--bg-tertiary); }
.graph-view canvas { display: block; width: 100%; height: 100%; cursor: grab; }
.graph-controls { position: absolute; top: 10px; left: 12px; display: flex; gap: 6px; }
.graph-controls button {
  background: var(--bg-secondary); border: 1px solid var(--border); color: var(--text-muted);
  border-radius: 6px; padding: 4px 10px; font-size: 12px; cursor: pointer;
}
.graph-controls button:hover { color: var(--text-normal); border-color: var(--accent); }

/* Status bar */
.statusbar {
  display: flex; align-items: center; gap: 14px; height: 24px; padding: 0 12px;
  background: var(--bg-tertiary); border-top: 1px solid var(--border);
  font-size: 11.5px; color: var(--text-faint); flex-shrink: 0;
}
.statusbar .clickable { cursor: pointer; }
.statusbar .clickable:hover { color: var(--text-normal); }

/* Quick switcher / palette modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.55);
  display: flex; justify-content: center; align-items: flex-start; z-index: 100; padding-top: 12vh;
}
.quick-switcher {
  width: 620px; max-width: 92vw; background: var(--bg-secondary);
  border: 1px solid var(--border); border-radius: 10px; overflow: hidden;
  box-shadow: 0 18px 50px rgba(0,0,0,.5);
}
.quick-switcher input {
  width: 100%; padding: 13px 16px; font-size: 15px; background: transparent;
  border: none; outline: none; color: var(--text-normal); border-bottom: 1px solid var(--border);
}
.qs-results { max-height: 380px; overflow-y: auto; padding: 6px; }
.qs-item { padding: 8px 12px; border-radius: 7px; cursor: pointer; display: flex; flex-direction: column; gap: 2px; }
.qs-item.selected { background: var(--bg-active); }
.qs-item .qs-title { font-size: 14px; color: var(--text-normal); }
.qs-item .qs-sub { font-size: 11.5px; color: var(--text-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qs-empty { padding: 18px; text-align: center; color: var(--text-faint); }

/* Welcome screen */
.welcome { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: var(--text-faint); }
.welcome h1 { color: var(--text-normal); font-weight: 650; margin: 0; }
.welcome .big-btn {
  background: var(--accent); color: #11111b; border: none; border-radius: 8px;
  padding: 10px 22px; font-size: 14px; font-weight: 600; cursor: pointer;
}
.welcome .big-btn:hover { filter: brightness(1.1); }
.welcome .ghost-btn {
  background: none; border: 1px solid var(--border); color: var(--text-muted); border-radius: 8px;
  padding: 9px 20px; font-size: 13px; cursor: pointer;
}
.welcome .ghost-btn:hover { border-color: var(--accent); color: var(--text-normal); }

.rename-input { background: var(--bg-primary); color: var(--text-normal); border: 1px solid var(--accent); border-radius: 4px; font-size: 13px; padding: 2px 6px; outline: none; width: 100%; }

.toast {
  position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
  background: var(--bg-active); color: var(--text-normal); padding: 9px 18px;
  border-radius: 8px; font-size: 13px; box-shadow: 0 6px 24px rgba(0,0,0,.4); z-index: 200;
  animation: fadein .18s ease-out;
}
@keyframes fadein { from { opacity: 0; transform: translate(-50%, 6px);} to { opacity: 1; transform: translate(-50%, 0);} }
.hidden-sidebar { display: none !important; }
`;
