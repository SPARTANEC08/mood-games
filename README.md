# Mood Games

Отдельный проект с браузерными играми. **Не является частью репозитория Mood** и
не коммитится в него — у него собственный репозиторий.

## Репозиторий

- Remote: `https://github.com/SPARTANEC08/mood-games.git`, ветка `main`.
- Локально: `/Users/spartanec/pro/mood-games`.
- Коммит после каждого изменения, затем push:

```bash
git fetch origin
git add <файлы>
git commit -m "feat(blockpop): что сделано"
git push origin main
```

- В git: исходники игр (`blockpop/src`), `deploy/` и документация.
- Не в git: `node_modules/`, `dist/`, `.env*`, `.idea/`, `.DS_Store`, `*.log`,
  `info.md`.
- `info.md` — общий с Mood файл с доступами и секретами. Локально это симлинк на
  `../mood/info.md`; в git и на сервер не попадает.

## Схема

```text
https://mood-app.online/            — главная: все игры
https://mood-app.online/about.html  — о проекте
https://mood-app.online/blockpop/   — Block Pop
https://mood-app.online/<slug>/     — следующая игра
```

В PWA Mood есть одна постоянная ссылка на хаб `https://mood-app.online/`.
Добавление новой игры не требует изменений в приложении.

Игры живут на отдельном origin: у них нет доступа к PWA-токену и `localStorage`
Mood.

## Структура

```text
pro/mood-games/
├── README.md
├── info.md                   # симлинк на ../mood/info.md (локально, не в git)
├── blockpop/                 # исходники Block Pop (dist/ и node_modules/ не в git)
│   ├── src/
│   ├── dist/
│   └── package.json
└── deploy/
    ├── README.md             # деплой, nginx, сертификат, ресурсы
    ├── nginx-mood-app-online.conf
    └── site/                 # статика хаба
        ├── index.html        # главная: все игры
        ├── about.html        # о проекте
        ├── style.css
        ├── app.js            # читает games.json
        ├── games.json        # список игр
        └── assets/           # лого, обложки, шрифты
```

## Правила

1. **Игры не коммитим в Mood.** Коммиты Mood — только приложение, бот и
   инфраструктура; игры, хаб и deploy-конфиги — в этом репозитории.
2. **Игры не хостим на RU.** Только шведский сервер.
3. **Статикой на сервере:** `/var/www/mood-games/<slug>/`.
4. **Старые сборки не копим.** На сервере лежит только текущая версия игры.
5. **Не встраиваем игры в iframe Mood.** Переход — обычной ссылкой на
   `mood-app.online`.
6. **Тяжёлые игры (10+ МБ)** — в CDN/объектное хранилище, а не на этот VPS.
7. **Новая игра** = новая папка `/<slug>/` + запись в `deploy/site/games.json`.
   Главную и ссылку в PWA менять не нужно.

## Добавить игру

1. Выложить сборку в `/var/www/mood-games/<slug>/`.
2. Добавить объект в `deploy/site/games.json`:

```json
{
  "slug": "my-game",
  "title": "My Game",
  "url": "my-game/",
  "description": "Короткое описание.",
  "tags": ["arcade", "2 min"],
  "cover": "assets/my-game-cover.png",
  "status": "live",
  "order": 3
}
```

`status`: `live` или `soon`; `cover` можно не указывать. После этого выложить
`deploy/site` — карточка появится сама.

## Быстрый деплой игры

```bash
cd /Users/spartanec/pro/mood-games/blockpop
npm run lint
npm run build

tar -C dist -cf /tmp/blockpop.tar .
scp /tmp/blockpop.tar se:/tmp/blockpop.tar

# пароль sudo — в локальном info.md, в git не хранится
ssh se
sudo -i
# на сервере:
rm -rf /var/www/mood-games/blockpop
mkdir -p /var/www/mood-games/blockpop
tar -C /var/www/mood-games/blockpop -xf /tmp/blockpop.tar
find /var/www/mood-games/blockpop -name "._*" -delete
chown -R root:root /var/www/mood-games/blockpop
chmod -R a+rX /var/www/mood-games/blockpop
rm -f /tmp/blockpop.tar
```

Подробности — в [`deploy/README.md`](deploy/README.md).
