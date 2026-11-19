import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  fsApiAvailable, openVaultFromDisk, writeNoteFile, deleteNoteFile, renameNoteFile,
  readNoteFile, loadFallbackVault, saveFallbackVault, basenameNoExt, joinPath, uniqueName, parentDir,
} from '../vault/fsVault.js';
import { SEED_NOTES } from '../vault/seedNotes.js';
import { buildGraph, resolveLinkTarget } from '../lib/linkGraph.js';

const VaultCtx = createContext(null);
export const useVault = () => useContext(VaultCtx);

const LS_TABS = 'brain-valet-tabs-v1';

function initialFiles() {
  const fallback = loadFallbackVault();
  if (fallback && fallback.size) return fallback;
  const map = new Map();
  for (const n of SEED_NOTES) map.set(n.path, { content: n.content, lastModified: Date.now() });
  return map;
}

export function VaultProvider({ children }) {
  const [rootHandle, setRootHandle] = useState(null); // File System Access dir handle
  const [files, setFiles] = useState(initialFiles);
  const [tabs, setTabs] = useState(() => {
    try {
      const t = JSON.parse(localStorage.getItem(LS_TABS));
      if (Array.isArray(t) && t.length) return t;
    } catch {}
    return ['Welcome.md'];
  });
  const [activeTab, setActiveTab] = useState(() => tabs[0] || null);
  const [graphViewOpen, setGraphViewOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const saveTimer = useRef(new Map());

  useEffect(() => {
    try { localStorage.setItem(LS_TABS, JSON.stringify(tabs)); } catch {}
  }, [tabs]);

  // Persist to localStorage when not backed by a real folder.
  useEffect(() => {
    if (!rootHandle) saveFallbackVault(files);
  }, [files, rootHandle]);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toast._t);
    toast._t = setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const graph = useMemo(() => buildGraph(files), [files]);

  const scheduleDiskWrite = useCallback((path, content) => {
    if (!rootHandle) return;
    const timers = saveTimer.current;
    clearTimeout(timers.get(path));
    timers.set(path, setTimeout(async () => {
      try { await writeNoteFile(rootHandle, path, content); }
      catch (e) { console.warn('disk write failed', e); toast('⚠ Disk write failed'); }
    }, 500));
  }, [rootHandle, toast]);

  const updateContent = useCallback((path, content) => {
    setFiles((prev) => {
      const next = new Map(prev);
      next.set(path, { content, lastModified: Date.now() });
      return next;
    });
    scheduleDiskWrite(path, content);
  }, [scheduleDiskWrite]);

  const openNote = useCallback((path) => {
    if (!path) return;
    setTabs((prev) => (prev.includes(path) ? prev : [...prev, path]));
    setActiveTab(path);
    setGraphViewOpen(false);
  }, []);

  const closeTab = useCallback((path) => {
    setTabs((prev) => {
      const idx = prev.indexOf(path);
      const next = prev.filter((p) => p !== path);
      if (path === activeTab) {
        setActiveTab(next[Math.max(0, idx - 1)] || null);
      }
      return next;
    });
  }, [activeTab]);

  const createNote = useCallback(async (desiredName = 'Untitled', dir = '') => {
    const name = uniqueName(dir, desiredName.trim() || 'Untitled', new Set(files.keys()));
    const path = joinPath(dir, name);
    const content = `# ${basenameNoExt(name)}\n\n`;
    setFiles((prev) => new Map(prev).set(path, { content, lastModified: Date.now() }));
    if (rootHandle) { try { await writeNoteFile(rootHandle, path, content); } catch (e) { console.warn(e); } }
    openNote(path);
    return path;
  }, [files, rootHandle, openNote]);

  const deleteNote = useCallback(async (path) => {
    if (!window.confirm(`Delete "${basenameNoExt(path)}"? This cannot be undone.`)) return;
    if (rootHandle) { try { await deleteNoteFile(rootHandle, path); } catch (e) { console.warn(e); } }
    setFiles((prev) => { const next = new Map(prev); next.delete(path); return next; });
    setTabs((prev) => prev.filter((p) => p !== path));
    setActiveTab((cur) => (cur === path ? null : cur));
    toast('Note deleted');
  }, [rootHandle, toast]);

  const renameNote = useCallback(async (oldPath, newName) => {
    const clean = newName.trim();
    if (!clean || clean === oldPath) return oldPath;
    const dir = parentDir(oldPath);
    const name = uniqueName(dir, clean.endsWith('.md') ? clean : `${clean}.md`, new Set([...files.keys()].filter((p) => p !== oldPath)));
    const newPath = joinPath(dir, name);
    const entry = files.get(oldPath);
    if (rootHandle) {
      try { await renameNoteFile(rootHandle, oldPath, newPath); }
      catch (e) { console.warn(e); toast('⚠ Rename failed on disk'); return oldPath; }
    }
    setFiles((prev) => { const next = new Map(prev); next.delete(oldPath); next.set(newPath, { ...entry, lastModified: Date.now() }); return next; });
    setTabs((prev) => prev.map((p) => (p === oldPath ? newPath : p)));
    setActiveTab((cur) => (cur === oldPath ? newPath : cur));
    return newPath;
  }, [files, rootHandle, toast]);

  // Open a wikilink target: navigate or offer to create.
  const openWikiLink = useCallback(async (target) => {
    const resolved = resolveLinkTarget(target, graph.nameIndex, activeTab);
    if (resolved) { openNote(resolved); return resolved; }
    const create = window.confirm(`"${target}" doesn't exist yet. Create it?`);
    if (!create) return null;
    return createNote(target, parentDir(activeTab || ''));
  }, [graph.nameIndex, activeTab, openNote, createNote]);

  const openVaultFolder = useCallback(async () => {
    try {
      const { rootHandle: handle, files: diskFiles } = await openVaultFromDisk();
      setRootHandle(handle);
      const merged = new Map(diskFiles);
      if (!merged.size) {
        for (const n of SEED_NOTES) {
          merged.set(n.path, { content: n.content, lastModified: Date.now() });
          try { await writeNoteFile(handle, n.path, n.content); } catch {}
        }
      }
      setFiles(merged);
      const first = merged.has('Welcome.md') ? 'Welcome.md' : [...merged.keys()][0];
      if (first) { setTabs([first]); setActiveTab(first); }
      toast(`Vault opened: ${handle.name}`);
    } catch (e) {
      if (e?.name !== 'AbortError') { console.warn(e); toast('⚠ Could not open folder'); }
    }
  }, [toast]);

  // Re-read note from disk when switching tabs (detect external edits).
  useEffect(() => {
    if (!rootHandle || !activeTab) return;
    let cancelled = false;
    (async () => {
      try {
        const { content } = await readNoteFile(rootHandle, activeTab);
        if (!cancelled) {
          setFiles((prev) => {
            const cur = prev.get(activeTab);
            if (cur && cur.content === content) return prev;
            if (cur && Date.now() - cur.lastModified < 1200) return prev; // local edit wins briefly
            return new Map(prev).set(activeTab, { content, lastModified: Date.now() });
          });
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [activeTab, rootHandle]);

  const value = {
    files, setFiles, tabs, activeTab, setActiveTab, openNote, closeTab,
    createNote, deleteNote, renameNote, updateContent, openWikiLink,
    graph, graphViewOpen, setGraphViewOpen,
    rootHandle, fsSupported: fsApiAvailable(), openVaultFolder,
    toastMsg, toast,
  };

  return <VaultCtx.Provider value={value}>{children}</VaultCtx.Provider>;
}
