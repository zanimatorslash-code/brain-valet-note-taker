import React, { useMemo } from 'react';
import { useVault } from '../vault/VaultContext.jsx';
import { basenameNoExt, parentDir } from '../vault/fsVault.js';
import { extractHeadings } from '../lib/markdown.js';

// Right sidebar: backlinks, links, outline, tags, note metadata.
export default function BacklinksPanel() {
  const { files, activeTab, openNote, graph, createNote } = useVault();
  if (!activeTab || !files.has(activeTab)) return null;

  const entry = files.get(activeTab);
  const content = entry?.content || '';
  const name = basenameNoExt(activeTab);

  const backlinks = [...(graph.incoming.get(activeTab) || [])];
  const outlinks = [...(graph.outgoing.get(activeTab) || [])];
  const unresolved = [...(graph.unresolved.get(activeTab) || [])];

  // Unlinked mentions: notes containing the note's name but no wikilink to it.
  const linkedSet = new Set([...backlinks]);
  const unlinked = [];
  const nameLower = name.toLowerCase();
  for (const [p, { content: c }] of files.entries()) {
    if (p === activeTab || linkedSet.has(p)) continue;
    if (c.toLowerCase().includes(nameLower)) {
      const line = c.split('\n').find((l) => l.toLowerCase().includes(nameLower));
      unlinked.push({ path: p, ctx: line?.trim().slice(0, 120) || '' });
    }
  }

  const headings = useMemo(() => extractHeadings(content), [content]);

  const tags = useMemo(() => {
    const set = new Set();
    // inline #tags (skip headings & hex colors)
    const re = /(?:^|\s)#([A-Za-z][\w/-]*)/g;
    let m;
    while ((m = re.exec(content)) !== null) set.add(m[1]);
    // frontmatter tags
    const fm = /^---\n([\s\S]*?)\n---/.exec(content);
    if (fm) {
      const tm = /tags?:\s*\[([^\]]*)\]/.exec(fm[1]);
      if (tm) tm[1].split(',').forEach((t) => t.trim() && set.add(t.trim()));
      const tl = [...fm[1].matchAll(/^\s*-\s*(\S+)$/gm)];
    }
    return [...set];
  }, [content]);

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars = content.length;

  const blItem = (path, ctxText) => (
    <div key={path} className="backlink-item" onClick={() => openNote(path)}>
      <div className="bl-title">{basenameNoExt(path)}</div>
      {ctxText && <div className="bl-ctx">{ctxText}</div>}
    </div>
  );

  return (
    <aside className="sidebar-right">
      <div className="panel-title">Linked mentions ({backlinks.length})</div>
      {backlinks.length === 0 && <div style={{ color: 'var(--text-faint)', fontSize: 12 }}>No links to this note yet.</div>}
      {backlinks.map((p) => {
        const c = files.get(p)?.content || '';
        const re = new RegExp(`\\[\\[${name}(#[^\\]|]*)?(\\|[^\\]]*)?\\]\\]`, 'i');
        const line = c.split('\n').find((l) => re.test(l));
        return blItem(p, line?.trim().slice(0, 120));
      })}

      {unlinked.length > 0 && (
        <>
          <div className="panel-title">Unlinked mentions ({unlinked.length})</div>
          {unlinked.slice(0, 8).map(({ path, ctx }) => blItem(path, ctx))}
        </>
      )}

      <div className="panel-title">Outgoing links ({outlinks.length + unresolved.length})</div>
      {outlinks.map((p) => (
        <div key={p} className="outline-item" onClick={() => openNote(p)}>→ {basenameNoExt(p)}</div>
      ))}
      {unresolved.map((t) => (
        <div
          key={t}
          className="outline-item"
          style={{ color: 'var(--link-unresolved)' }}
          title={`Create note "${t}"`}
          onClick={() => createNote(t, parentDir(activeTab))}
        >∘ {t} <span style={{ opacity: .6 }}>(create)</span></div>
      ))}

      {headings.length > 0 && (
        <>
          <div className="panel-title">Outline</div>
          {headings.map((h, i) => (
            <div key={i} className="outline-item" style={{ paddingLeft: (h.level - 1) * 12 }}>
              {h.text}
            </div>
          ))}
        </>
      )}

      {tags.length > 0 && (
        <>
          <div className="panel-title">Tags</div>
          <div>{tags.map((t) => <span key={t} className="tag-chip">#{t}</span>)}</div>
        </>
      )}

      <div className="panel-title">Note info</div>
      <div className="meta-row"><span>Words</span><span>{words.toLocaleString()}</span></div>
      <div className="meta-row"><span>Characters</span><span>{chars.toLocaleString()}</span></div>
      <div className="meta-row"><span>Backlinks</span><span>{backlinks.length}</span></div>
      <div className="meta-row">
        <span>Modified</span>
        <span>{new Date(entry.lastModified || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </aside>
  );
}
