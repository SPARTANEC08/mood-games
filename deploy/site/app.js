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
  const linkAttrs = (url) => isExternal(url) ? ' target="_blank" rel="noopener"' : '';

  const cover = (game) => {
    if (game.cover) {
      return `<img src="${esc(game.cover)}" alt="${esc(game.title)}" loading="lazy">`;
    }
    return `<div class="cover-fallback"><img src="assets/cabinet-mark.png" alt=""></div>`;
  };

  const card = (game) => {
    const live = game.status === 'live' && Boolean(game.url);

    const screen = live
      ? `<a class="cab-screen" href="${esc(game.url)}"${linkAttrs(game.url)} aria-label="${esc(game.title)} — играть">${cover(game)}</a>`
      : `<div class="cab-screen">${cover(game)}</div>`;

    return `
      <article class="cabinet-card${live ? '' : ' soon'}">
        ${screen}
        <div class="cab-bottom">
          <span class="cab-name">${esc(game.title)}</span>
          ${live
            ? `<a class="play" href="${esc(game.url)}"${linkAttrs(game.url)}>Play</a>`
            : `<span class="play disabled">Soon</span>`}
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
        <article class="cabinet-card">
          <div class="cab-screen"><div class="cover-fallback"><img src="assets/cabinet-mark.png" alt=""></div></div>
          <div class="cab-bottom">
            <span class="cab-name">Ошибка</span>
            <a class="play" href="/">Обновить</a>
          </div>
        </article>`;
      if (count) count.textContent = '';
    });
})();
