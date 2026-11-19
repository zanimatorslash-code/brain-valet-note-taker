import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useVault } from '../vault/VaultContext.jsx';
import { basenameNoExt } from '../vault/fsVault.js';
import { searchFiles } from '../lib/linkGraph.js';

// Obsidian-style quick switcher (Ctrl+O) and command palette (Ctrl+P).
export default function QuickSwitcher({ mode, onClose }) {
  const { files, openNote, createNote, setGraphViewOpen, graphViewOpen, openVaultFolder, fsSupported, toast } = useVault();
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const commands = useMemo(() => ([
    { title: 'New note', hint: 'Create a new markdown note', run: () => createNote('Untitled', '') },
    { title: 'Toggle graph view', hint: 'Show/hide the relationship graph', run: () => { setGraphViewOpen(!graphViewOpen); onClose(); } },
    ...(fsSupported ? [{ title: 'Open vault folder from disk…', hint: 'Use a real folder for your notes', run: () => { openVaultFolder(); onClose(); } }] : []),
    { title: 'Close current tab', hint: '', run: () => { onClose(); } },
  ]), [graphViewOpen, fsSupported, createNote, setGraphViewOpen, openVaultFolder, onClose]);

  const results = useMemo(() => {
    if (mode === 'palette') {
      const q = query.toLowerCase();
      const cmds = commands.filter((c) => !q || c.title.toLowerCase().includes(q));
      const notes = searchFiles(files, query).slice(0, 8).map((r) => ({
        title: basenameNoExt(r.path), sub: r.path, run: () => openNote(r.path),
      }));
      return [...cmds.map((c) => ({ ...c, kind: 'command' })), ...notes.map((n) => ({ ...n, kind: 'note' }))];
    }
    // quick switcher: fuzzy-ish filter over file names + content search
    const paths = [...files.keys()];
    const q = query.toLowerCase().trim();
    let list;
    if (!q) list = paths.map((p) => ({ path: p, score: 0, matches: [] }));
    else {
      const nameMatches = paths
        .filter((p) => p.toLowerCase().includes(q))
        .map((p) => ({ path: p, score: -basenameNoExt(p).toLowerCase().indexOf(q), matches: [] }));
      const contentMatches = searchFiles(files, query).filter((r) => !nameMatches.some((m) => m.path === r.path));
      list = [...nameMatches, ...contentMatches];
    }
    return list.slice(0, 30).map((r) => ({
      title: basenameNoExt(r.path),
      sub: r.matches?.[0]?.text || r.path,
      kind: 'note',
      run: () => openNote(r.path),
    }));
  }, [mode, query, files, commands, openNote]);

  useEffect(() => { setSel(0); }, [query, mode]);

  const choose = (item) => {
    if (!item) return;
    item.run();
    onClose();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(results[sel]); }
  };

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="quick-switcher">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={mode === 'palette' ? 'Type a command…' : 'Find or create a note…'}
          spellCheck={false}
        />
        <div className="qs-results">
          {results.length === 0 && (
            <div className="qs-empty">
              No matches. Press Enter to create “{query.trim()}”.
            </div>
          )}
          {results.map((r, i) => (
            <div
              key={`${r.kind}-${r.title}-${i}`}
              className={`qs-item ${i === sel ? 'selected' : ''}`}
              onMouseEnter={() => setSel(i)}
              onClick={() => choose(r)}
            >
              <span className="qs-title">{r.kind === 'command' ? '⚙ ' : '📄 '}{r.title}</span>
              {(r.sub || r.hint) && <span className="qs-sub">{r.sub || r.hint}</span>}
            </div>
          ))}
          {mode === 'switcher' && query.trim() && !results.some((r) => r.title.toLowerCase() === query.trim().toLowerCase()) && (
            <div
              className={`qs-item ${sel === results.length ? 'selected' : ''}`}
              onMouseEnter={() => setSel(results.length)}
              onClick={() => { createNote(query.trim(), ''); onClose(); }}
            >
              <span className="qs-title">➕ Create new note “{query.trim()}”</span>
              <span className="qs-sub">Press Enter</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
