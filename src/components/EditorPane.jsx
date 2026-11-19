import React, { useState } from 'react';
import { useVault } from '../vault/VaultContext.jsx';
import { basenameNoExt } from '../vault/fsVault.js';
import MarkdownEditor from '../editor/MarkdownEditor.jsx';
import Preview from './Preview.jsx';

export default function EditorPane() {
  const { files, activeTab, updateContent, openWikiLink, graphViewOpen, deleteNote, renameNote } = useVault();
  const [mode, setMode] = useState('edit'); // edit | preview

  if (graphViewOpen) return null;
  if (!activeTab || !files.has(activeTab)) {
    return (
      <div className="welcome">
        <h1>🧠 Brain Valet</h1>
        <p>No note open. Pick one from the vault, or press <b>Ctrl/Cmd + O</b> to switch.</p>
      </div>
    );
  }

  const entry = files.get(activeTab);
  const content = entry?.content || '';

  return (
    <>
      <div className="pane-toolbar">
        <span className="path" title={activeTab}>{activeTab}</span>
        <span style={{ flex: 1 }} />
        <button className="icon-btn" title="Rename note (F2)" onClick={() => {
          const n = window.prompt('Rename note:', basenameNoExt(activeTab));
          if (n) renameNote(activeTab, n);
        }}>✎</button>
        <button className="icon-btn" title="Delete note" onClick={() => deleteNote(activeTab)}>🗑</button>
        <div className="mode-toggle">
          <button className={mode === 'edit' ? 'on' : ''} onClick={() => setMode('edit')}>Edit</button>
          <button className={mode === 'preview' ? 'on' : ''} onClick={() => setMode('preview')}>Preview</button>
        </div>
      </div>
      <div className="editor-area">
        {mode === 'edit' ? (
          <MarkdownEditor
            value={content}
            onChange={(v) => updateContent(activeTab, v)}
            onTogglePreview={() => setMode((m) => (m === 'edit' ? 'preview' : 'edit'))}
            openWikiLink={openWikiLink}
          />
        ) : (
          <Preview content={content} onTogglePreview={() => setMode('edit')} />
        )}
      </div>
    </>
  );
}
