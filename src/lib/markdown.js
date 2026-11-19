import { Marked } from 'marked';
import DOMPurify from 'dompurify';

const marked = new Marked({ gfm: true, breaks: false });

// Render [[wikilinks]] as <a class="internal-link" data-href="..."> before markdown parsing.
function preprocessWikilinks(src) {
  return src.replace(
    /(!?)\[\[([^\[\]|#]*)(?:#([^\[\]|]*))?(?:\|([^\[\]]*))?\]\]/g,
    (whole, embed, target, heading, alias) => {
      const t = target.trim();
      if (!t) return whole;
      const label = (alias && alias.trim()) || t + (heading ? ` › ${heading.trim()}` : '');
      const href = `${t}${heading ? '#' + heading.trim() : ''}`;
      if (embed) {
        return `<span class="transclusion" data-href="${escapeAttr(href)}" title="Embed of ${escapeAttr(t)}">↳ ${escapeHtml(label)}</span>`;
      }
      return `<a class="internal-link" data-href="${escapeAttr(href)}" href="#/note/${encodeURIComponent(t)}">${escapeHtml(label)}</a>`;
    }
  );
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}

export function renderMarkdown(source) {
  const processed = preprocessWikilinks(source);
  const html = marked.parse(processed);
  return DOMPurify.sanitize(html, { ADD_ATTR: ['data-href', 'target'] });
}

// Extract headings for the outline view.
export function extractHeadings(source) {
  const headings = [];
  const lines = source.split('\n');
  let inCode = false;
  lines.forEach((line, i) => {
    if (/^```/.test(line)) { inCode = !inCode; return; }
    if (inCode) return;
    const m = /^(#{1,6})\s+(.*)$/.exec(line);
    if (m) headings.push({ level: m[1].length, text: m[2].trim(), line: i });
  });
  return headings;
}

export function firstHeadingOrTitle(source, fallback) {
  const h = extractHeadings(source)[0];
  return h ? h.text : fallback;
}
