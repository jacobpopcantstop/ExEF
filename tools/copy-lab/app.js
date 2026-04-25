const app = document.getElementById('app');

function levelForPoints(points) {
  if (points >= 1000) return 'Voice Architect';
  if (points >= 600) return 'Copy Finisher';
  if (points >= 300) return 'Revision Builder';
  if (points >= 120) return 'Sentence Shaper';
  return 'Warm-Up Writer';
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed.');
  }
  return data;
}

function statsMarkup(state) {
  const stats = state.stats;
  const level = levelForPoints(stats.points);
  return `
    <section class="hero-panel">
      <div>
        <p class="eyebrow">ExEF Copy Lab</p>
        <h1>Methodical copy work, without losing your place.</h1>
        <p class="lede">Edit a few safe text blocks at a time. Each save writes straight into the site source and logs your progress locally on this machine.</p>
      </div>
      <div class="score-grid">
        <article class="score-card">
          <span class="score-card__label">Points</span>
          <strong>${stats.points}</strong>
          <span class="score-card__note">${level}</span>
        </article>
        <article class="score-card">
          <span class="score-card__label">Progress</span>
          <strong>${stats.percent}%</strong>
          <span class="score-card__note">${stats.completed} of ${stats.total} blocks done</span>
        </article>
        <article class="score-card">
          <span class="score-card__label">Streak</span>
          <strong>${stats.currentStreak}</strong>
          <span class="score-card__note">best ${stats.bestStreak}</span>
        </article>
        <article class="score-card">
          <span class="score-card__label">Saves</span>
          <strong>${stats.saves}</strong>
          <span class="score-card__note">${stats.skips} skips</span>
        </article>
      </div>
    </section>
  `;
}

function pageOptionsMarkup(state, selectedFile) {
  const options = ['<option value="">All pages</option>'];
  state.pages.forEach((page) => {
    const selected = page.file === selectedFile ? ' selected' : '';
    options.push(`<option value="${escapeHtml(page.file)}"${selected}>${escapeHtml(page.file)} (${page.completed}/${page.total})</option>`);
  });
  return options.join('');
}

function queueMarkup(state) {
  if (!state.queue.length) {
    return `
      <section class="empty-state">
        <h2>No queued copy blocks</h2>
        <p>The current filter is fully cleared. Pick another page, or enjoy being done.</p>
      </section>
    `;
  }

  return `
    <section class="queue">
      ${state.queue.map((chunk, index) => `
        <article class="chunk-card" data-chunk-id="${escapeHtml(chunk.id)}">
          <div class="chunk-card__meta">
            <span class="pill">Round ${index + 1}</span>
            <span>${escapeHtml(chunk.file)}:${chunk.line}</span>
            <span>${chunk.sentenceCount} sentence${chunk.sentenceCount === 1 ? '' : 's'}</span>
          </div>
          <h2>${escapeHtml(chunk.tagName.toUpperCase())} copy block</h2>
          <p class="chunk-card__original-label">Current live-source text</p>
          <blockquote class="chunk-card__original">${escapeHtml(chunk.text)}</blockquote>
          <label class="chunk-card__label" for="edit-${escapeHtml(chunk.id)}">Your revision</label>
          <textarea id="edit-${escapeHtml(chunk.id)}" data-role="edit-box">${escapeHtml(chunk.text)}</textarea>
          <div class="chunk-card__actions">
            <button type="button" class="btn btn--primary" data-action="save">Save + Score 15</button>
            <button type="button" class="btn btn--ghost" data-action="skip">Skip for Now +1</button>
            <a class="btn btn--ghost" href="/preview/${encodeURIComponent(chunk.file)}" target="_blank" rel="noreferrer">Preview Page</a>
          </div>
        </article>
      `).join('')}
    </section>
  `;
}

function render(state, selectedFile, notice = '') {
  app.innerHTML = `
    <main class="shell">
      ${statsMarkup(state)}
      <section class="toolbar">
        <div>
          <label for="page-filter">Focus page</label>
          <select id="page-filter">${pageOptionsMarkup(state, selectedFile)}</select>
        </div>
        <div class="toolbar__legend">
          <span class="pill pill--accent">Safe mode</span>
          <span>Only plain text blocks are queued, so styled fragments and linked copy are left alone.</span>
        </div>
      </section>
      ${notice ? `<p class="notice">${escapeHtml(notice)}</p>` : ''}
      ${queueMarkup(state)}
    </main>
  `;

  const pageFilter = document.getElementById('page-filter');
  pageFilter.addEventListener('change', () => {
    loadState(pageFilter.value);
  });

  app.querySelectorAll('.chunk-card').forEach((card) => {
    const chunkId = card.dataset.chunkId;
    const textarea = card.querySelector('[data-role="edit-box"]');
    const currentChunk = state.queue.find((chunk) => chunk.id === chunkId);

    card.querySelector('[data-action="save"]').addEventListener('click', async () => {
      try {
        card.classList.add('is-busy');
        const nextState = await requestJson('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: chunkId,
            originalText: currentChunk.text,
            updatedText: textarea.value
          })
        });
        render(nextState, selectedFile, 'Saved to source file.');
      } catch (error) {
        render(state, selectedFile, error.message);
      }
    });

    card.querySelector('[data-action="skip"]').addEventListener('click', async () => {
      try {
        card.classList.add('is-busy');
        const nextState = await requestJson('/api/skip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: chunkId })
        });
        render(nextState, selectedFile, 'Skipped for now.');
      } catch (error) {
        render(state, selectedFile, error.message);
      }
    });
  });
}

async function loadState(selectedFile = '') {
  const suffix = selectedFile ? `?file=${encodeURIComponent(selectedFile)}` : '';
  const state = await requestJson(`/api/state${suffix}`);
  render(state, selectedFile);
}

loadState().catch((error) => {
  app.innerHTML = `<main class="shell"><p class="notice">${escapeHtml(error.message)}</p></main>`;
});
