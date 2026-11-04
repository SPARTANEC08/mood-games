# Деплой игр Mood на шведский сервер

Игры живут отдельно от Mood: свой статический каталог, свой домен и свой
nginx-server. RU-сервер не используется.

## Репозиторий

Исходники и конфиги — в `https://github.com/SPARTANEC08/mood-games.git`
(локально `/Users/spartanec/pro/mood-games`, ветка `main`, коммит + push после
каждого изменения). Деплой выкладывает **только** сборку игры (`<slug>/dist`) и
`games-index.html`; корень репозитория на сервер не копируется. `info.md` —
общий с Mood файл доступов, локальный симлинк `../mood/info.md`; в git и на
сервер не попадает.

## Домен

```text
https://mood-app.online/            — хаб: выбор игр
https://mood-app.online/blockpop/   — Block Pop
https://mood-app.online/<slug>/     — следующая игра
```

A-записи домена:

```text
A     @    109.120.129.61
A     www  109.120.129.61
```

Сертификат Let's Encrypt уже выпущен на `mood-app.online` и
`www.mood-app.online`, продление — через certbot timer.

## Старый адрес

Старый адрес на sslip отключён:

```text
https://109-120-129-61.sslip.io/games/block-blast/   # больше не игра
```

## Сборка и выкладка игры

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

## Nginx

Конфиг домена: `deploy/nginx-mood-app-online.conf`. На сервере он лежит как
`/etc/nginx/sites-available/mood-games` и подключён симлинком в
`/etc/nginx/sites-enabled/`.

```bash
scp deploy/nginx-mood-app-online.conf se:/tmp/nginx-mood-app-online.conf

# пароль sudo — в локальном info.md, в git не хранится
ssh se
sudo -i
cp -a /etc/nginx/sites-available/mood-games /root/mood-games.bak-$(date +%s)
cp /tmp/nginx-mood-app-online.conf /etc/nginx/sites-available/mood-games
ln -sf /etc/nginx/sites-available/mood-games /etc/nginx/sites-enabled/mood-games
rm -f /tmp/nginx-mood-app-online.conf
nginx -t && systemctl reload nginx
```

## Хаб игр

Страница выбора игр — `deploy/games-index.html`. На сервере:

```text
/var/www/mood-games/index.html
```

Новая игра = новая папка `/var/www/mood-games/<slug>/` + новая карточка в хабе.
Ссылка в PWA не меняется.

## Ссылка из PWA

Игра не встраивается в iframe. Кнопка «Mood Games» в «Кабинете» Mood открывает
хаб `https://mood-app.online/` в новой вкладке (в standalone-PWA — в текущем
окне). Кнопка «Вернуться в Mood» внутри игры возвращает на
`https://mood-app.ru/`.

## Ресурсы

На сервере добавлены:

- swap-файл `/swapfile` на 1 ГБ;
- `vm.swappiness=10` и `vm.vfs_cache_pressure=50`;
- `worker_connections 4096` и `worker_rlimit_nofile 16384` в nginx;
- очищены старые PWA-бэкапы, apt-кеш и журналы.

Новые игры кладутся в отдельные подкаталоги `/var/www/mood-games/<slug>/`.
Старые версии не копим: на сервере должна лежать только текущая сборка.
Тяжёлые игры (10+ МБ) — в CDN/объектное хранилище, а не на этот VPS.

## Проверка

```bash
curl -sI https://mood-app.online/ | grep -i 'content-type'
curl -sI https://mood-app.online/blockpop/ | grep -i 'content-security-policy\|content-type'
curl -s -o /dev/null -w '%{http_code}\n' https://mood-app.online/blockpop/assets/index-DCtda0_9.js
```
