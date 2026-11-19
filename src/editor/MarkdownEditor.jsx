import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import {
  EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection,
  rectangularSelection, highlightActiveLineGutter, ViewPlugin, Decoration,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { syntaxHighlighting, defaultHighlightStyle, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

const obsidianTheme = EditorView.theme({
  '&': { color: 'var(--text-normal)', backgroundColor: 'transparent', height: '100%' },
  '.cm-scroller': { overflow: 'auto' },
  '.cm-content': { caretColor: 'var(--accent)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--accent)' },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 8px 0 16px', minWidth: '24px' },
  '.cm-search': { background: 'var(--bg-secondary)', color: 'var(--text-normal)', border: '1px solid var(--border)' },
  '.cm-search button, .cm-search input': { background: 'var(--bg-hover)', color: 'var(--text-normal)', border: '1px solid var(--border)', borderRadius: '4px' },
  '.cm-panels-bottom': { borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' },
});

const mdHighlight = HighlightStyle.define([
  { tag: tags.heading1, fontSize: '1.55em', fontWeight: '700', color: '#cba6f7' },
  { tag: tags.heading2, fontSize: '1.32em', fontWeight: '700', color: '#cba6f7' },
  { tag: tags.heading3, fontSize: '1.14em', fontWeight: '700', color: '#cba6f7' },
  { tag: [tags.heading4, tags.heading5, tags.heading6], fontWeight: '700', color: '#cba6f7' },
  { tag: tags.strong, fontWeight: '700', color: '#f9e2af' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#f5c2e7' },
  { tag: tags.strikethrough, textDecoration: 'line-through', color: 'var(--text-faint)' },
  { tag: tags.link, color: 'var(--accent)' },
  { tag: tags.url, color: 'var(--accent)' },
  { tag: tags.monospace, color: '#a6e3a1', fontFamily: 'var(--font-mono)' },
  { tag: tags.quote, color: 'var(--text-muted)', fontStyle: 'italic' },
  { tag: tags.list, color: '#fab387' },
  { tag: tags.contentSeparator, color: 'var(--text-faint)' },
]);

// Live-preview style decorations for [[wikilinks]] (color target text).
const wikiRe = /\[\[([^\[\]|#]*)(?:#[^\[\]|]*)?(?:\|[^\[\]]*)?\]\]/g;
const wikilinkPlugin = ViewPlugin.fromClass(
  class {
    constructor(view) { this.decos = this.build(view); }
    update(u) { if (u.docChanged || u.viewportChanged) this.decos = this.build(u.view); }
    build(view) {
      const { doc } = view.state;
      const deco = [];
      for (const { from, to } of view.visibleRanges) {
        const text = doc.sliceString(from, to);
        let m;
        wikiRe.lastIndex = 0;
        while ((m = wikiRe.exec(text)) !== null) {
          const start = from + m.index;
          const end = start + m[0].length;
          deco.push(Decoration.mark({ class: 'cm-wikilink' }).range(start, end));
        }
      }
      return Decoration.set(deco, true);
    }
  },
  { decorations: (v) => v.decos }
);

const wikilinkTheme = EditorView.baseTheme({
  '.cm-wikilink': { color: 'var(--accent)', backgroundColor: 'rgba(137,180,250,.08)', borderRadius: '3px' },
});

export default function MarkdownEditor({ value, onChange, onTogglePreview, openWikiLink }) {
  const hostRef = useRef(null);
  const viewRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const openLinkRef = useRef(openWikiLink);
  const toggleRef = useRef(onTogglePreview);
  const applyingExternal = useRef(false);
  onChangeRef.current = onChange;
  openLinkRef.current = openWikiLink;
  toggleRef.current = onTogglePreview;

  useEffect(() => {
    if (!hostRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !applyingExternal.current && onChangeRef.current) {
        onChangeRef.current(update.state.doc.toString());
      }
    });

    const clickHandler = EditorView.domEventHandlers({
      mousedown(event, view) {
        if (!(event.ctrlKey || event.metaKey)) return false;
        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (pos == null) return false;
        const doc = view.state.doc;
        const line = doc.line(doc.lineAt(pos).number);
        const rel = pos - line.from;
        const re = new RegExp(wikiRe.source, 'g');
        let m;
        while ((m = re.exec(line.text)) !== null) {
          if (rel >= m.index && rel <= m.index + m[0].length) {
            event.preventDefault();
            openLinkRef.current?.(m[1].trim());
            return true;
          }
        }
        return false;
      },
    });

    const keys = keymap.of([
      { key: 'Mod-e', preventDefault: true, run: () => { toggleRef.current?.(); return true; } },
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap,
      { key: 'Tab', preventDefault: true, run: indentWithTab },
    ]);

    const state = EditorState.create({
      doc: value ?? '',
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        drawSelection(),
        rectangularSelection(),
        highlightSelectionMatches(),
        EditorState.allowMultipleSelections.of(true),
        markdown({ codeLanguages: languages }),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        syntaxHighlighting(mdHighlight),
        wikilinkPlugin,
        wikilinkTheme,
        EditorView.lineWrapping,
        keys,
        updateListener,
        clickHandler,
        obsidianTheme,
      ],
    });

    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;
    return () => view.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the note changes (tab switch / external reload), replace the document.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (value !== current) {
      applyingExternal.current = true;
      view.dispatch({ changes: { from: 0, to: current.length, insert: value ?? '' } });
      applyingExternal.current = false;
    }
  }, [value]);

  return <div className="cm-host" ref={hostRef} />;
}
