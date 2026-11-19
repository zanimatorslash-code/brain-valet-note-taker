// Local-first vault storage backed by the File System Access API (Chrome/Edge).
// Falls back to an in-memory + localStorage vault when the API is unavailable.

const LS_KEY = 'brain-valet-vault-v1';

export function fsApiAvailable() {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

function extFromName(name) {
  const i = name.lastIndexOf('.');
  return i === -1 ? '' : name.slice(i + 1).toLowerCase();
}

export function isMarkdownPath(path) {
  const ext = extFromName(path);
  return ext === 'md' || ext === 'markdown' || ext === 'txt';
}

export function basenameNoExt(path) {
  const base = path.split('/').pop() || '';
  const i = base.lastIndexOf('.');
  return i <= 0 ? base : base.slice(0, i);
}

export function parentDir(path) {
  const i = path.lastIndexOf('/');
  return i === -1 ? '' : path.slice(0, i);
}

export function joinPath(dir, name) {
  return dir ? `${dir}/${name}` : name;
}

export function uniqueName(dir, desired, existingPaths) {
  let name = desired;
  if (!extFromName(name)) name += '.md';
  const taken = new Set([...existingPaths].map((p) => p.toLowerCase()));
  if (!taken.has(joinPath(dir, name).toLowerCase())) return name;
  const noExt = basenameNoExt(name);
  let n = 2;
  while (taken.has(joinPath(dir, `${noExt} ${n}.md`).toLowerCase())) n++;
  return `${noExt} ${n}.md`;
}

// ---------- Directory handle helpers ----------

async function getDirHandle(rootHandle, dirPath, create = false) {
  let handle = rootHandle;
  if (!dirPath) return handle;
  for (const part of dirPath.split('/').filter(Boolean)) {
    try {
      handle = await handle.getDirectoryHandle(part);
    } catch (e) {
      if (create) handle = await handle.getDirectoryHandle(part, { create: true });
      else return null;
    }
  }
  return handle;
}

async function walkDir(handle, prefix, out) {
  for await (const [name, entry] of handle.entries()) {
    const path = joinPath(prefix, name);
    if (entry.kind === 'file') {
      if (isMarkdownPath(path)) {
        const file = await entry.getFile();
        const content = await file.text();
        out.set(path, { content, lastModified: file.lastModified });
      }
    } else if (entry.kind === 'directory' && !name.startsWith('.')) {
      await walkDir(entry, path, out);
    }
  }
}

export async function openVaultFromDisk() {
  const rootHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
  const files = new Map();
  await walkDir(rootHandle, '', files);
  return { rootHandle, files };
}

export async function readNoteFile(rootHandle, path) {
  const dir = parentDir(path);
  const name = path.split('/').pop();
  const dirHandle = await getDirHandle(rootHandle, dir);
  if (!dirHandle) throw new Error(`Folder not found: ${dir}`);
  const fileHandle = await dirHandle.getFileHandle(name);
  const file = await fileHandle.getFile();
  return { content: await file.text(), lastModified: file.lastModified };
}

export async function writeNoteFile(rootHandle, path, content) {
  const dir = parentDir(path);
  const name = path.split('/').pop();
  const dirHandle = await getDirHandle(rootHandle, dir, true);
  const fileHandle = await dirHandle.getFileHandle(name, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
  return Date.now();
}

export async function deleteNoteFile(rootHandle, path) {
  const dir = parentDir(path);
  const name = path.split('/').pop();
  const dirHandle = await getDirHandle(rootHandle, dir);
  if (dirHandle) await dirHandle.removeEntry(name);
}

export async function renameNoteFile(rootHandle, oldPath, newPath) {
  const { content } = await readNoteFile(rootHandle, oldPath);
  await writeNoteFile(rootHandle, newPath, content);
  await deleteNoteFile(rootHandle, oldPath);
}

export async function createFolderHandle(rootHandle, folderPath) {
  await getDirHandle(rootHandle, folderPath, true);
}

// ---------- Fallback vault (localStorage) ----------

export function loadFallbackVault() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      return new Map(Object.entries(obj));
    }
  } catch (e) {
    console.warn('Failed to load fallback vault', e);
  }
  return null;
}

export function saveFallbackVault(filesMap) {
  try {
    const obj = Object.fromEntries(filesMap.entries());
    localStorage.setItem(LS_KEY, JSON.stringify(obj));
  } catch (e) {
    console.warn('Failed to persist fallback vault', e);
  }
}
