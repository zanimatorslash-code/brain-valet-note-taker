import { basenameNoExt } from '../vault/fsVault.js';

// Parse [[wikilinks]] and ![[embeds]] out of markdown text.
export function extractLinks(text) {
  const links = [];
  const re = /(!?)\[\[([^\[\]|#]*)(?:#[^\[\]|]*)?(?:\|[^\[\]]*)?\]\]/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const target = m[2].trim();
    if (target) links.push({ embed: m[1] === '!', target });
  }
  return links;
}

// Build a name -> path index (case-insensitive, like Obsidian's resolver).
export function buildNameIndex(paths) {
  const index = new Map();
  for (const p of paths) {
    const key = basenameNoExt(p).toLowerCase();
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(p);
  }
  return index;
}

export function resolveLinkTarget(target, nameIndex, currentPath) {
  const clean = target.replace(/\.md$/, '').replace(/\.markdown$/, '').trim();
  if (!clean) return null;
  // Full-path style link: "folder/note"
  const direct = nameIndex.get(basenameNoExt(clean).toLowerCase());
  if (direct) {
    if (clean.includes('/')) {
      const match = direct.find((p) => p.toLowerCase().endsWith(clean.toLowerCase()));
      if (match) return match;
    }
    return direct[0];
  }
  return null;
}

// files: Map<path, {content}>
export function buildGraph(files) {
  const paths = [...files.keys()];
  const nameIndex = buildNameIndex(paths);
  const outgoing = new Map(); // path -> Set<path>
  const incoming = new Map(); // path -> Set<path>
  const unresolved = new Map(); // path -> Set<targetText>

  for (const p of paths) {
    outgoing.set(p, new Set());
    if (!incoming.has(p)) incoming.set(p, new Set());
  }

  for (const p of paths) {
    const text = files.get(p)?.content || '';
    for (const { target } of extractLinks(text)) {
      const resolved = resolveLinkTarget(target, nameIndex, p);
      if (resolved && resolved !== p) {
        outgoing.get(p).add(resolved);
        incoming.get(resolved).add(p);
      } else if (!resolved) {
        if (!unresolved.has(p)) unresolved.set(p, new Set());
        unresolved.get(p).add(target);
      }
    }
  }

  return { outgoing, incoming, unresolved, nameIndex };
}

export function searchFiles(files, query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const results = [];
  for (const [path, { content }] of files.entries()) {
    const name = basenameNoExt(path).toLowerCase();
    const lines = content.split('\n');
    let score = 0;
    const matches = [];
    if (name.includes(q)) score += 10;
    for (let i = 0; i < lines.length; i++) {
      const lower = lines[i].toLowerCase();
      const idx = lower.indexOf(q);
      if (idx !== -1) {
        score += 1;
        if (matches.length < 5) {
          matches.push({ line: i + 1, text: lines[i].trim().slice(0, 160) });
        }
      }
    }
    if (score > 0) results.push({ path, score, matches });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 50);
}
