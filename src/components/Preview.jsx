import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useVault } from '../vault/VaultContext.jsx';
import { basenameNoExt } from '../vault/fsVault.js';
import { renderMarkdown } from '../lib/markdown.js';
import { resolveLinkTarget } from '../lib/linkGraph.js';

// Rendered reading view with clickable wikilinks.
export default function Preview({ content, onTogglePreview }) {
  const { files, activeTab, openWikiLink, graph } = useVault();
  const hostRef = useRef(null);

  const html = useMemo(() => renderMarkdown(content || ''), [content]);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    // Mark unresolved links & intercept clicks.
    const anchors = el.querySelectorAll('a.internal-link');
    for (const a of anchors) {
      const href = a.getAttribute('data-href') || '';
      const target = href.split('#')[0];
      const resolved = resolveLinkTarget(target, graph.nameIndex, activeTab);
      if (!resolved) a.classList.add('unresolved');
    }
    const onClick = (e) => {
      const a = e.target.closest('a.internal-link, .transclusion');
      if (a) {
        e.preventDefault();
        const href = a.getAttribute('data-href') || '';
        openWikiLink(href.split('#')[0]);
        return;
      }
      const ext = e.target.closest('a[href^="http"]');
      if (ext) { e.preventDefault(); window.open(ext.href, '_blank', 'noopener'); }
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [html, graph, activeTab, openWikiLink]);

  return (
    <div className="preview">
      <div className="markdown-body" ref={hostRef} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
