import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const EDITABLE_TAGS = ['p', 'h1', 'h2', 'h3', 'h4', 'li', 'figcaption', 'blockquote'];
const EXCLUDED_CONTAINER_TAGS = ['nav', 'footer', 'script', 'style', 'svg', 'noscript', 'template'];
const PROGRESS_VERSION = 1;
const DEFAULT_POINTS_PER_SAVE = 15;
const DEFAULT_POINTS_PER_SKIP = 1;

const ENTITY_MAP = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '-',
  ndash: '-',
  hellip: '...',
  rsquo: "'",
  lsquo: "'",
  rdquo: '"',
  ldquo: '"',
  copy: '©'
};

function ensureProgressShape(progress) {
  return {
    version: PROGRESS_VERSION,
    points: Number(progress?.points || 0),
    saves: Number(progress?.saves || 0),
    skips: Number(progress?.skips || 0),
    currentStreak: Number(progress?.currentStreak || 0),
    bestStreak: Number(progress?.bestStreak || 0),
    lastActionAt: progress?.lastActionAt || null,
    completed: progress?.completed && typeof progress.completed === 'object' ? progress.completed : {},
    skipped: progress?.skipped && typeof progress.skipped === 'object' ? progress.skipped : {}
  };
}

export function loadProgress(progressPath) {
  try {
    const raw = fs.readFileSync(progressPath, 'utf8');
    return ensureProgressShape(JSON.parse(raw));
  } catch (error) {
    return ensureProgressShape({});
  }
}

export function saveProgress(progressPath, progress) {
  fs.mkdirSync(path.dirname(progressPath), { recursive: true });
  fs.writeFileSync(progressPath, `${JSON.stringify(ensureProgressShape(progress), null, 2)}\n`, 'utf8');
}

function decodeHtmlEntity(entity) {
  if (entity.startsWith('#x') || entity.startsWith('#X')) {
    const codePoint = Number.parseInt(entity.slice(2), 16);
    return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : `&${entity};`;
  }
  if (entity.startsWith('#')) {
    const codePoint = Number.parseInt(entity.slice(1), 10);
    return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : `&${entity};`;
  }
  return Object.prototype.hasOwnProperty.call(ENTITY_MAP, entity) ? ENTITY_MAP[entity] : `&${entity};`;
}

export function decodeHtml(text) {
  return String(text || '').replace(/&([a-zA-Z0-9#]+);/g, (_, entity) => decodeHtmlEntity(entity));
}

export function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function normalizeCopy(text) {
  return String(text || '')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function hashText(text) {
  return crypto.createHash('sha1').update(String(text || '')).digest('hex').slice(0, 10);
}

function lineNumberAt(source, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (source[i] === '\n') line += 1;
  }
  return line;
}

function getExcludedRanges(source) {
  const ranges = [];
  EXCLUDED_CONTAINER_TAGS.forEach((tag) => {
    const pattern = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
    let match;
    while ((match = pattern.exec(source))) {
      ranges.push([match.index, match.index + match[0].length]);
    }
  });
  return ranges.sort((a, b) => a[0] - b[0]);
}

function isInsideRanges(index, ranges) {
  return ranges.some(([start, end]) => index >= start && index < end);
}

function innerHtmlIsSafe(innerHtml) {
  const withoutComments = innerHtml.replace(/<!--[\s\S]*?-->/g, '');
  const withoutBreaks = withoutComments.replace(/<br\s*\/?>/gi, '\n');
  return !/<[a-z!/][^>]*>/i.test(withoutBreaks);
}

export function htmlToPlainText(innerHtml) {
  return normalizeCopy(
    decodeHtml(
      innerHtml
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
    )
  );
}

function isMeaningfulText(text) {
  if (!text || text.length < 20) return false;
  const alphaCount = (text.match(/[A-Za-z]/g) || []).length;
  return alphaCount >= 12;
}

export function extractEditableChunks(source, relativePath) {
  const ranges = getExcludedRanges(source);
  const pattern = /<(p|h1|h2|h3|h4|li|figcaption|blockquote)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  const ordinals = new Map();
  const chunks = [];
  let match;

  while ((match = pattern.exec(source))) {
    const [fullMatch, tagName, rawAttrs, innerHtml] = match;
    if (isInsideRanges(match.index, ranges)) continue;
    if (/\b(hidden|aria-hidden\s*=\s*["']?true["']?)\b/i.test(rawAttrs)) continue;
    if (!innerHtmlIsSafe(innerHtml)) continue;

    const text = htmlToPlainText(innerHtml);
    if (!isMeaningfulText(text)) continue;

    const ordinal = (ordinals.get(tagName) || 0) + 1;
    ordinals.set(tagName, ordinal);

    const openTag = fullMatch.indexOf('>') + 1;
    const closeTag = fullMatch.lastIndexOf(`</${tagName}>`);
    const innerStart = match.index + openTag;
    const innerEnd = match.index + closeTag;
    const id = `${relativePath}::${tagName}::${ordinal}`;

    chunks.push({
      id,
      file: relativePath,
      tagName,
      ordinal,
      line: lineNumberAt(source, match.index),
      text,
      textHash: hashText(text),
      sentenceCount: Math.max(1, text.split(/[.!?]+(?=\s|$)/).filter(Boolean).length),
      start: match.index,
      end: match.index + fullMatch.length,
      innerStart,
      innerEnd
    });
  }

  return chunks;
}

export function listHtmlFiles(rootDir) {
  const visiblePages = getCopyLabPageSet(rootDir);
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html') && visiblePages.has(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

export function loadVisibilityConfig(rootDir) {
  const configPath = path.join(rootDir, 'data', 'site-visibility.json');
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    return {};
  }
}

export function getCopyLabPageSet(rootDir) {
  const config = loadVisibilityConfig(rootDir);
  if (Array.isArray(config.copyLabOnlyPages) && config.copyLabOnlyPages.length) {
    return new Set(config.copyLabOnlyPages);
  }

  const hidden = new Set([...(config.hiddenPages || []), ...(config.utilityPages || [])]);
  return new Set(
    fs
      .readdirSync(rootDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.html') && !hidden.has(entry.name))
      .map((entry) => entry.name)
  );
}

export function extractWorkspaceChunks(rootDir) {
  const files = listHtmlFiles(rootDir);
  const chunks = [];

  files.forEach((relativePath) => {
    const source = fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
    chunks.push(...extractEditableChunks(source, relativePath));
  });

  return chunks.sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.line - b.line;
  });
}

export function getWorkspaceState(rootDir, progressPath, selectedFile = '') {
  const progress = loadProgress(progressPath);
  const allChunks = extractWorkspaceChunks(rootDir);
  const filteredChunks = selectedFile ? allChunks.filter((chunk) => chunk.file === selectedFile) : allChunks;
  const remaining = filteredChunks.filter((chunk) => !progress.completed[chunk.id]);
  const pages = [];
  const byFile = new Map();

  filteredChunks.forEach((chunk) => {
    if (!byFile.has(chunk.file)) {
      byFile.set(chunk.file, {
        file: chunk.file,
        total: 0,
        completed: 0,
        remaining: 0
      });
    }
    const record = byFile.get(chunk.file);
    record.total += 1;
    if (progress.completed[chunk.id]) {
      record.completed += 1;
    } else {
      record.remaining += 1;
    }
  });

  pages.push(...Array.from(byFile.values()).sort((a, b) => a.file.localeCompare(b.file)));

  const total = filteredChunks.length;
  const completedCount = filteredChunks.filter((chunk) => progress.completed[chunk.id]).length;
  const remainingCount = total - completedCount;

  return {
    progress,
    filters: {
      selectedFile
    },
    stats: {
      total,
      completed: completedCount,
      remaining: remainingCount,
      percent: total ? Math.round((completedCount / total) * 100) : 0,
      points: progress.points,
      saves: progress.saves,
      skips: progress.skips,
      currentStreak: progress.currentStreak,
      bestStreak: progress.bestStreak
    },
    pages,
    queue: remaining.slice(0, 3).map((chunk) => ({
      id: chunk.id,
      file: chunk.file,
      tagName: chunk.tagName,
      line: chunk.line,
      text: chunk.text,
      textHash: chunk.textHash,
      sentenceCount: chunk.sentenceCount
    }))
  };
}

function updateStreak(progress) {
  progress.currentStreak += 1;
  progress.bestStreak = Math.max(progress.bestStreak, progress.currentStreak);
  progress.lastActionAt = new Date().toISOString();
}

function resetStreak(progress) {
  progress.currentStreak = 0;
  progress.lastActionAt = new Date().toISOString();
}

export function saveChunkEdit(rootDir, progressPath, payload) {
  const { id, updatedText, originalText } = payload || {};
  if (!id || typeof updatedText !== 'string') {
    throw new Error('Missing chunk id or updated text.');
  }

  const [relativePath] = id.split('::');
  if (!relativePath) {
    throw new Error('Invalid chunk id.');
  }
  if (!getCopyLabPageSet(rootDir).has(relativePath)) {
    throw new Error('That page is not part of the current Copy Lab editing surface.');
  }

  const filePath = path.join(rootDir, relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const chunks = extractEditableChunks(source, relativePath);
  const chunk = chunks.find((item) => item.id === id);
  if (!chunk) {
    throw new Error('Chunk no longer exists. Refresh the queue and try again.');
  }

  const currentNormalized = normalizeCopy(chunk.text);
  const originalNormalized = normalizeCopy(originalText || '');
  if (originalText && currentNormalized !== originalNormalized) {
    throw new Error('That copy changed since it was loaded. Refresh before saving.');
  }

  const nextText = normalizeCopy(updatedText);
  if (!isMeaningfulText(nextText)) {
    throw new Error('Edits must contain a meaningful amount of text.');
  }

  const replacementInnerHtml = escapeHtml(nextText).replace(/\n/g, '<br>\n');
  const updatedSource = `${source.slice(0, chunk.innerStart)}${replacementInnerHtml}${source.slice(chunk.innerEnd)}`;
  fs.writeFileSync(filePath, updatedSource, 'utf8');

  const progress = loadProgress(progressPath);
  progress.completed[id] = {
    completedAt: new Date().toISOString(),
    file: relativePath,
    pointsAwarded: DEFAULT_POINTS_PER_SAVE,
    originalHash: chunk.textHash,
    updatedHash: hashText(nextText)
  };
  progress.points += DEFAULT_POINTS_PER_SAVE;
  progress.saves += 1;
  delete progress.skipped[id];
  updateStreak(progress);
  saveProgress(progressPath, progress);

  return getWorkspaceState(rootDir, progressPath);
}

export function skipChunk(rootDir, progressPath, payload) {
  const { id } = payload || {};
  if (!id) {
    throw new Error('Missing chunk id.');
  }
  const [relativePath] = id.split('::');
  if (!relativePath || !getCopyLabPageSet(rootDir).has(relativePath)) {
    throw new Error('That page is not part of the current Copy Lab editing surface.');
  }

  const progress = loadProgress(progressPath);
  const current = progress.skipped[id] || { count: 0 };
  progress.skipped[id] = {
    count: current.count + 1,
    skippedAt: new Date().toISOString(),
    pointsAwarded: DEFAULT_POINTS_PER_SKIP
  };
  progress.points += DEFAULT_POINTS_PER_SKIP;
  progress.skips += 1;
  resetStreak(progress);
  saveProgress(progressPath, progress);

  return getWorkspaceState(rootDir, progressPath);
}
