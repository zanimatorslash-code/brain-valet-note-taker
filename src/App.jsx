import React, { useEffect, useState } from 'react';
import { VaultProvider, useVault } from './vault/VaultContext.jsx';
import { themeCss, appCss } from './styles.js';
import FileExplorer from './components/FileExplorer.jsx';
import EditorPane from './components/EditorPane.jsx';
import BacklinksPanel from './components/BacklinksPanel.jsx';
import GraphView from './components/GraphView.jsx';
import QuickSwitcher from './components/QuickSwitcher.jsx';
import { basenameNoExt } from './vault/fsVault.js';

function StyleInjector() {
  useEffect(() => {
    const mk = (id, css) => {
      const s = document.createElement('style');
      s.id = id; s.textContent = css;
      document.head.appendChild(s);
    };
    if (!document.getElementById('theme-css')) mk('theme-css', themeCss);
    if (!document.getElementById('app-css')) mk('app-css', appCss);
  }, []);
  return null;
}

function Shell() {
  const vault = useVault();
  const { tabs, activeTab, setActiveTab, closeTab, createNote, graphViewOpen, setGraphViewOpen, files, toastMsg, rootHandle, fsSupported, openVaultFolder } = vault;
  const [modal, setModal] = useState(null); // 'switcher' | 'palette' | null
  const [sidebarsHidden, setSidebarsHidden] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'o') { e.preventDefault(); setModal((m) => (m ? null : 'switcher')); }
      else if (mod && e.key.toLowerCase() === 'p') { e.preventDefault(); setModal((m) => (m ? null : 'palette')); }
      else if (mod && e.key === '\`') { e.preventDefault(); setGraphViewOpen(!graphViewOpen); }
      else if (mod && e.key.toLowerCase() === 'n') { e.preventDefault(); createNote('Untitled', ''); }
      else if (mod && e.shiftKey && e.key.toLowerCase() === 'f') { e.preventDefault(); setModal('switcher'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [graphViewOpen, setGraphViewOpen, createNote]);

  const activeEntry = activeTab ? files.get(activeTab) : null;
  const words = activeEntry?.content?.trim() ? activeEntry.content.trim().split(/\s+/).length : 0;

  return (
    <div className="app-shell">
      <StyleInjector />
      <div className="titlebar">
        <span className="logo">🧠 Brain Valet</span>
        <button className="icon-btn" title="Toggle sidebars" onClick={() => setSidebarsHidden((v) => !v)}>◧</button>
        <button className="icon-btn" title="Quick switcher (Ctrl+O)" onClick={() => setModal('switcher')}>🔍</button>
        <button className="icon-btn" title="Command palette (Ctrl+P)" onClick={() => setModal('palette')}>⌘</button>
        <span className="spacer" />
        <button className="icon-btn" title="Graph view (Ctrl+`)" onClick={() => setGraphViewOpen(!graphViewOpen)}>
          {graphViewOpen ? '📝 Notes' : '🕸 Graph'}
        </button>
        {fsSupported && !rootHandle && (
          <button className="icon-btn" title="Open a folder as your vault" onClick={openVaultFolder}>📂 Open folder</button>
        )}
      </div>

      <div className="main-row">
        <div className={sidebarsHidden ? 'hidden-sidebar' : ''} style={{ display: 'contents' }}>
          <FileExplorer />
        </div>

        <div className="workspace">
          <div className="tabbar">
            {tabs.map((t) => (
              <div
                key={t}
                className={`tab ${t === activeTab && !graphViewOpen ? 'active' : ''}`}
                onClick={() => { setActiveTab(t); setGraphViewOpen(false); }}
                onAuxClick={(e) => { if (e.button === 1) closeTab(t); }}
                title={t}
              >
                <span className="tab-title">{basenameNoExt(t)}</span>
                <button className="close" onClick={(e) => { e.stopPropagation(); closeTab(t); }}>×</button>
              </div>
            ))}
            <button className="tab-add" title="New note (Ctrl+N)" onClick={() => createNote('Untitled', '')}>＋</button>
          </div>

          {graphViewOpen ? <GraphView /> : <EditorPane />}
        </div>

        <div className={sidebarsHidden ? 'hidden-sidebar' : ''} style={{ display: 'contents' }}>
          {!graphViewOpen && <BacklinksPanel />}
        </div>
      </div>

      <div className="statusbar">
        <span>{files.size} notes</span>
        <span>{[...files.values()].reduce((a, f) => a + (f.content?.length || 0), 0).toLocaleString()} chars</span>
        <span className="spacer" style={{ flex: 1 }} />
        {activeTab && !graphViewOpen && <span>{words.toLocaleString()} words</span>}
        <span>{rootHandle ? `💾 ${rootHandle.name}` : '💾 browser storage'}</span>
        <span className="clickable" onClick={() => setModal('palette')}>⌘ Ctrl+P</span>
      </div>

      {modal && <QuickSwitcher mode={modal} onClose={() => setModal(null)} />}
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  );
}

export default function App() {
  return (
    <VaultProvider>
      <Shell />
    </VaultProvider>
  );
}
