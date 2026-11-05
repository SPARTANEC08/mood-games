# Деплой Mood Games на шведский сервер

Игры и хаб живут отдельно от Mood: свой статический каталог, свой домен и свой
nginx-server. RU-сервер не используется.

## Репозиторий

Исходники и конфиги — в `https://github.com/SPARTANEC08/mood-games.git`
(локально `/Users/spartanec/pro/mood-games`, ветка `main`, коммит + push после
каждого изменения).

`info.md` — общий с Mood файл доступов, локальный симлинк `../mood/info.md`;
в git и на сервер не попадает. `ads.txt` лежит в корне сайта и в git не идёт.

## Что где

```text
deploy/
├── site/                         # то, что лежит в /var/www/mood-games
│   ├── index.html                # главная: все игры
│   ├── about.html                # «О нас»
│   ├── style.css
│   ├── app.js                    # рендер карточек из games.json
│   ├── games.json                # список игр
│   └── assets/                   # лого, обложки, шрифты
├── nginx-mood-app-online.conf
└── README.md
```

На сервере:

```text
/var/www/mood-games/index.html
/var/www/mood-games/about.html
/var/www/mood-games/style.css
/var/www/mood-games/app.js
/var/www/mood-games/games.json
/var/www/mood-games/assets/
/var/www/mood-games/<slug>/       # сборка игры
/var/www/mood-games/ads.txt       # реклама, вручную
```

## Домен

```text
https://mood-app.online/            — главная: все игры
https://mood-app.online/about.html  — о проекте
https://mood-app.online/blockpop/   — Block Pop
https://mood-app.online/musor-drop/ — Мусор Дроп
https://mood-app.online/<slug>/     — следующая игра
```

A-записи: `@` и `www` → `109.120.129.61`. Сертификат Let's Encrypt продлевается
certbot timer.

Старый адрес `109-120-129-61.sslip.io/games/block-blast/` отключён.

## Как добавить игру

1. Собрать игру и выложить её в `/var/www/mood-games/<slug>/` (команды ниже).
2. Добавить объект в `deploy/site/games.json`:

```json
{
  "slug": "my-game",
  "title": "My Game",
  "url": "my-game/",
  "description": "Короткое описание в одну-две строки.",
  "tags": ["arcade", "2 min"],
  "cover": "assets/my-game-cover.png",
  "status": "live",
  "order": 3
}
```

- `status`: `"live"` или `"soon"`. У `"soon"` можно не указывать `url`.
- `cover` необязателен. Без него карточка покажет автомат-заглушку.
- Обложка: скриншот 1280×760 в `deploy/site/assets/<slug>-cover.png`.
- `order` — порядок карточек. Новые игры можно просто добавлять в конец.

3. Выложить `deploy/site` (команда ниже). Код главной менять не нужно.

## Деплой хаба

```bash
cd /Users/spartanec/pro/mood-games

tar -C deploy/site -cf /tmp/mood-games-site.tar .
scp /tmp/mood-games-site.tar se:/tmp/mood-games-site.tar

# пароль sudo — в локальном info.md
ssh se
sudo -i
cp -a /var/www/mood-games /root/mood-games.bak-$(date +%s)
tar -C /var/www/mood-games -xf /tmp/mood-games-site.tar
find /var/www/mood-games -name "._*" -delete
chown -R root:root /var/www/mood-games
chmod -R a+rX /var/www/mood-games
rm -f /tmp/mood-games-site.tar
```

`tar` распаковывается **поверх**: `blockpop/`, `ads.txt` и другие игры не
удаляются. Старые файлы хаба перезаписываются.

При изменениях `style.css` или `app.js` поднимай `?v=` в `index.html` и
`about.html`, чтобы браузер не держал старую версию.

## Деплой игры

```bash
cd /Users/spartanec/pro/mood-games/<slug>
npm run lint
npm run build

tar -C dist -cf /tmp/<slug>.tar .
scp /tmp/<slug>.tar se:/tmp/<slug>.tar

ssh se
sudo -i
rm -rf /var/www/mood-games/<slug>
mkdir -p /var/www/mood-games/<slug>
tar -C /var/www/mood-games/<slug> -xf /tmp/<slug>.tar
find /var/www/mood-games/<slug> -name "._*" -delete
chown -R root:root /var/www/mood-games/<slug>
chmod -R a+rX /var/www/mood-games/<slug>
rm -f /tmp/<slug>.tar
```

## Nginx

Конфиг домена: `deploy/nginx-mood-app-online.conf`. На сервере:
`/etc/nginx/sites-available/mood-games`, симлинк в `sites-enabled/`.

```bash
scp deploy/nginx-mood-app-online.conf se:/tmp/nginx-mood-app-online.conf

ssh se
sudo -i
cp -a /etc/nginx/sites-available/mood-games /root/mood-games.bak-$(date +%s)
cp /tmp/nginx-mood-app-online.conf /etc/nginx/sites-available/mood-games
ln -sf /etc/nginx/sites-available/mood-games /etc/nginx/sites-enabled/mood-games
rm -f /tmp/nginx-mood-app-online.conf
nginx -t && systemctl reload nginx
```

## Проверка

```bash
curl -sI https://mood-app.online/ | grep -i 'content-type'
curl -sI https://mood-app.online/about.html | grep -i 'content-type'
curl -s -o /dev/null -w '%{http_code}\n' https://mood-app.online/games.json
curl -s -o /dev/null -w '%{http_code}\n' https://mood-app.online/assets/style.css
curl -s -o /dev/null -w '%{http_code}\n' https://mood-app.online/blockpop/
```

## Ссылка из PWA

Игра не встраивается в iframe. Кнопка «Mood Games» в «Кабинете» Mood открывает
хаб `https://mood-app.online/` в новой вкладке (в standalone-PWA — в текущем
окне). Кнопка «Вернуться в Mood» внутри игры возвращает на
`https://mood-app.ru/`.

## Ресурсы и правила

- Новые игры — в отдельные подкаталоги `/var/www/mood-games/<slug>/`.
- На сервере держим только текущую сборку, старые версии не копим.
- Тяжёлые игры (10+ МБ) — в CDN/объектное хранилище, не на VPS.
- `ads.txt` — в корне сайта, в git не коммитится.
