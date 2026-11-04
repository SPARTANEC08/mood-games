(() => {
  const grid = document.getElementById('games-grid');
  const count = document.getElementById('games-count');
  if (!grid) return;

  const esc = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const plural = (n) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return `${n} игра`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} игры`;
    return `${n} игр`;
  };

  const isExternal = (url) => /^https?:\/\//i.test(url || '');
  const linkAttrs = (url) => isExternal(url)
    ? ' target="_blank" rel="noopener"'
    : '';

  const cover = (game) => {
    if (game.cover) {
      return `<img src="${esc(game.cover)}" alt="${esc(game.title)}" loading="lazy">`;
    }
    return `<div class="cover-fallback"><img src="assets/cabinet-mark.png" alt=""></div>`;
  };

  const card = (game) => {
    const live = game.status === 'live' && Boolean(game.url);
    const tags = (game.tags || [])
      .map((tag, i) => `<span class="tag${i === 0 ? ' hi' : ''}">${esc(tag)}</span>`)
      .join('');

    const media = live
      ? `<a class="cover" href="${esc(game.url)}"${linkAttrs(game.url)} aria-label="${esc(game.title)} — играть">${cover(game)}</a>`
      : `<div class="cover" aria-hidden="true">${cover(game)}</div>`;

    return `
      <article class="game-card${live ? '' : ' soon'}">
        ${media}
        <span class="badge${live ? '' : ' soon'}"><i></i>${live ? 'live' : 'soon'}</span>
        <div class="game-body">
          <div class="title-row">
            <h3>${esc(game.title)}</h3>
            ${live ? `<span class="arrow" aria-hidden="true">↗</span>` : ''}
          </div>
          <p>${esc(game.description)}</p>
          <div class="tags">${tags}</div>
          <div class="game-foot">
            <span class="score">${live ? 'бесплатно' : 'скоро'}</span>
            ${live
              ? `<a class="play" href="${esc(game.url)}"${linkAttrs(game.url)}>Играть</a>`
              : `<span class="play disabled">Скоро</span>`}
          </div>
        </div>
      </article>`;
  };

  fetch('games.json', { cache: 'no-cache' })
    .then((res) => {
      if (!res.ok) throw new Error(`games.json: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      const games = (data.games || [])
        .slice()
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

      grid.innerHTML = games.map(card).join('');
      if (count) count.textContent = plural(games.filter((g) => g.status === 'live').length);
    })
    .catch(() => {
      grid.innerHTML = `
        <article class="game-card">
          <div class="game-body">
            <h3>Не удалось загрузить игры</h3>
            <p>Обнови страницу или открой Block Pop напрямую.</p>
            <div class="game-foot">
              <span class="score"></span>
              <a class="play" href="blockpop/">Играть</a>
            </div>
          </div>
        </article>`;
      if (count) count.textContent = '';
    });
})();
