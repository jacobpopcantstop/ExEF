import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  extractEditableChunks,
  getWorkspaceState,
  htmlToPlainText,
  loadProgress,
  saveChunkEdit,
  skipChunk
} from '../scripts/copy-lab-lib.mjs';

test('extractEditableChunks ignores nav/footer and keeps meaningful plain-text blocks', () => {
  const html = `<!DOCTYPE html>
  <html><body>
    <nav><p>Search the site</p></nav>
    <main>
      <h1>Rewrite this headline for my voice</h1>
      <p>This paragraph is long enough to qualify for editing work.</p>
      <p><span>Styled copy should stay out of the queue.</span></p>
    </main>
    <footer><p>Footer text should not appear.</p></footer>
  </body></html>`;

  const chunks = extractEditableChunks(html, 'sample.html');

  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].text, 'Rewrite this headline for my voice');
  assert.equal(chunks[1].text, 'This paragraph is long enough to qualify for editing work.');
});

test('htmlToPlainText decodes entities and preserves line breaks', () => {
  const text = htmlToPlainText('A &ldquo;quoted&rdquo; line<br>with&nbsp;space');
  assert.equal(text, 'A "quoted" line\nwith space');
});

test('saveChunkEdit writes updated text into the source file and marks progress', () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copy-lab-root-'));
  const progressPath = path.join(rootDir, 'tmp/progress.json');

  fs.writeFileSync(path.join(rootDir, 'page.html'), '<main><p>This paragraph is ready to be rewritten in a stronger voice.</p></main>');

  const state = getWorkspaceState(rootDir, progressPath);
  assert.equal(state.queue.length, 1);

  const nextState = saveChunkEdit(rootDir, progressPath, {
    id: state.queue[0].id,
    originalText: state.queue[0].text,
    updatedText: 'This paragraph now sounds more direct and specific.'
  });

  const updatedHtml = fs.readFileSync(path.join(rootDir, 'page.html'), 'utf8');
  const progress = loadProgress(progressPath);

  assert.match(updatedHtml, /This paragraph now sounds more direct and specific\./);
  assert.equal(progress.saves, 1);
  assert.equal(progress.points, 15);
  assert.equal(nextState.stats.completed, 1);
});

test('skipChunk awards a point and leaves the chunk available for later', () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copy-lab-root-'));
  const progressPath = path.join(rootDir, 'tmp/progress.json');

  fs.writeFileSync(path.join(rootDir, 'page.html'), '<main><p>This paragraph is ready to be skipped for now because I want to tackle it later.</p></main>');

  const initial = getWorkspaceState(rootDir, progressPath);
  const skipped = skipChunk(rootDir, progressPath, { id: initial.queue[0].id });

  assert.equal(skipped.stats.points, 1);
  assert.equal(skipped.stats.skips, 1);
  assert.equal(skipped.stats.remaining, 1);
});
