import React, { useMemo, useState } from 'react';
import { useVault } from '../vault/VaultContext.jsx';
import { basenameNoExt, parentDir, joinPath } from '../vault/fsVault.js';

// Build a nested tree from flat paths.
function buildTree(paths) {
  const root = { name: '', dirs: new Map(), files: [] };
  for (const p of paths) {
    const parts = p.split('/');
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!node.dirs.has(parts[i])) node.dirs.set(parts[i], { name: parts[i], dirs: new Map(), files: [] });
      node = node.dirs.get(parts[i]);
    }
    node.files.push({ path: p, name: parts[parts.length - 1] });
  }
  return root;
}

function sortNode(node) {
  const dirs = [...node.dirs.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const files = [...node.files].sort((a, b) => a.name.localeCompare(b.name));
  return { dirs, files };
}

function TreeNode({ node, depth, collapsed, toggle, ctx }) {
  const { activeTab, openNote, deleteNote, renameNote, createNote } = ctx;
  const [renaming, setRenaming] = useState(null); // path being renamed
  const [draft, setDraft] = useState('');
  const { dirs, files } = sortNode(node);
  const dirPathOf = depth === 0 ? '' : null; // computed by caller via prefix prop instead

  return (
    <>
      {dirs.map(([name, child]) => {
        const folderPath = node.__path ? joinPath(node.__path, name) : name;
        const isCollapsed = collapsed.has(folderPath);
        return (
          <div key={folderPath}>
            <div
              className="tree-item folder"
              style={{ paddingLeft: 8 + depth * 14 }}
              onClick={() => toggle(folderPath)}
              onContextMenu={(e) => { e.preventDefault(); /* could add new-note-in-folder here */ }}
              title={folderPath}
            >
              <span className="chevron">{isCollapsed ? '▶' : '▼'}</span>
              <span>📁</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
            </div>
            {!isCollapsed && (
              <div className="tree-children-wrap">
                <TreeNode node={withPath(child, folderPath)} depth={depth + 1} collapsed={collapsed} toggle={toggle} ctx={ctx} />
              </div>
            )}
          </div>
        );
      })}
      {files.map(({ path, name }) => (
        <div
          key={path}
          className={`tree-item ${path === activeTab ? 'active' : ''}`}
          style={{ paddingLeft: 22 + depth * 14 }}
          onClick={() => renaming !== path && openNote(path)}
          onDoubleClick={() => { setRenaming(path); setDraft(basenameNoExt(name)); }}
          onContextMenu={(e) => {
            e.preventDefault();
            if (window.confirm(`Delete "${basenameNoExt(name)}"?`)) deleteNote(path);
          }}
          title={path}
        >
          <span>📄</span>
          {renaming === path ? (
            <input
              className="rename-input"
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={async () => { setRenaming(null); await renameNote(path, draft); }}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') { setRenaming(null); await renameNote(path, draft); }
                if (e.key === 'Escape') setRenaming(null);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{basenameNoExt(name)}</span>
          )}
        </div>
      ))}
    </>
  );
}

function withPath(node, path) {
  return Object.assign(Object.create(Object.getPrototypeOf(node)), node, { __path: path });
}

export default function FileExplorer() {
  const vault = useVault();
  const { files, activeTab, openNote, deleteNote, renameNote, createNote, rootHandle, fsSupported, openVaultFolder } = vault;
  const [collapsed, setCollapsed] = useState(new Set());
  const tree = useMemo(() => buildTree([...files.keys()]), [files]);

  const toggle = (p) => setCollapsed((prev) => {
    const next = new Set(prev);
    next.has(p) ? next.delete(p) : next.add(p);
    return next;
  });

  const ctx = { activeTab, openNote, deleteNote, renameNote, createNote };

  const newNoteHere = async () => {
    const name = window.prompt('New note name:', 'Untitled');
    if (name === null) return;
    await createNote(name, '');
  };

  return (
    <aside className="sidebar-left">
      <div className="sidebar-header">
        <span>{rootHandle ? `📂 ${rootHandle.name}` : '🧠 Vault'}</span>
        <span>
          <button className="icon-btn" title="New note" onClick={newNoteHere}>＋</button>
          {fsSupported && (
            <button className="icon-btn" title={rootHandle ? 'Change vault folder' : 'Open folder from disk'} onClick={openVaultFolder}>📂</button>
          )}
        </span>
      </div>
      <div className="file-tree">
        <TreeNode node={tree} depth={0} collapsed={collapsed} toggle={toggle} ctx={ctx} />
        {!files.size && <div style={{ padding: 12, color: 'var(--text-faint)' }}>No notes yet. Click ＋ to create one.</div>}
      </div>
    </aside>
  );
}
