export const SEED_NOTES = [
  {
    path: 'Welcome.md',
    content: `---
tags: [start-here]
---

# Welcome to Brain Valet 👋

This is your **local-first knowledge base**, inspired by Obsidian.

## What you can do

- Write Markdown with live syntax highlighting
- Link notes with \\[\\[wikilinks\\]\\] — try linking to [[The Zettelkasten Method]]
- See **backlinks** and **unlinked mentions** in the right sidebar
- Explore your graph of thoughts in the **Graph view**
- Search everywhere with \`Ctrl/Cmd + O\` (quick switcher) or \`Ctrl/Cmd + P\` palette
- Open a real folder from disk — your notes are plain \`.md\` files

## Getting started

1. Create a new note with the **+** button in the file explorer
2. Select some text and type \\[\\[ to link it to another note
3. Switch between **Edit** and **Preview** with \`Ctrl/Cmd + E\`

> [!tip] Pro tip
> Notes that are linked but don't exist yet show up as unresolved links in the graph. Click one to create it.

Related: [[Markdown Cheatsheet]] · [[Projects/Reading List]]
`,
  },
  {
    path: 'The Zettelkasten Method.md',
    content: `# The Zettelkasten Method

A method of note-taking where each note is **atomic** — one idea per note —
and notes are connected through explicit links.

## Core principles

1. **Atomicity** — one idea per note
2. **Connectivity** — every note should link to others, e.g. back to [[Welcome]]
3. **Emergence** — structure grows bottom-up, not from rigid folders

## Example flow

Capture an idea → write it in your own words → link it → revisit later.

See also: [[Markdown Cheatsheet]]
`,
  },
  {
    path: 'Markdown Cheatsheet.md',
    content: `# Markdown Cheatsheet

## Text

*italic*, **bold**, ~~strikethrough~~, \`inline code\`

## Lists

- [ ] A task
- [x] A completed task
- Bullet point
  - Nested bullet

## Code

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Tables

| Feature | Status |
| ------- | ------ |
| Wikilinks | ✅ |
| Backlinks | ✅ |
| Graph view | ✅ |
| Tags | ✅ #productivity |

## Quotes & callouts

> Simple blockquote

Links: [[The Zettelkasten Method]] · [[Welcome]]
`,
  },
  {
    path: 'Projects/Reading List.md',
    content: `# Reading List

## Currently reading

- **How to Take Smart Notes** — ties into [[The Zettelkasten Method]]

## Queue

- [ ] *Thinking in Systems*
- [ ] *The Design of Everyday Things*

Back to [[Welcome]]
`,
  },
];
