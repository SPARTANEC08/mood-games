# Block Pop

Браузерная головоломка для `https://mood-app.online/blockpop/`.

Это отдельная игра, **не часть Mood**. Исходники не коммитятся в репозиторий
Mood и деплоятся только на шведский сервер.

## Локально

```bash
npm install
npm run dev
```

## Сборка

```bash
npm run lint
npm run build
```

`dist/` выкладывается в `/var/www/mood-games/blockpop/` на SE. Подробности —
в [`../deploy/README.md`](../deploy/README.md).
