# Brick & Razor — лендинг мужского барбершопа

**Live:** https://barbershop-landing-wheat.vercel.app

Одностраничный лендинг + Telegram-бот барбершопа. Два пути записи: форма на лендинге (заявка → админу) и полная запись прямо в чате бота (услуга → барбер → день → время → телефон). Бэкенд — serverless-функции на Vercel; токен бота в браузер не утекает.

## Стек

- **Vite 8** — сборщик и dev-сервер
- **Tailwind CSS v4** (через `@tailwindcss/vite`)
- **Vanilla JS** (ES-модули) — фронт лендинга
- **grammY + TypeScript** — клиентский бот (webhook), сборка через esbuild в `api/bot.js`
- **Upstash Redis** — хранилище сессий бота (HTTP/REST, serverless-friendly)
- **Vercel Functions** (Node.js) — приём заявок и вебхук бота
- **Telegram Bot API** — доставка сообщений администратору

## Архитектура

```
Браузер                  Vercel                       Telegram
┌──────────────┐   POST  ┌────────────────────────┐   POST  ┌─────────┐
│ index.html   │  ────►  │ api/booking.js          │  ────► │ Bot API │
│ main.js      │ /api/   │ (читает TG_BOT_TOKEN,   │        │         │
│ (без токена) │ booking │  TG_CHAT_ID из env)     │        │         │
└──────────────┘  ◄──── ─└────────────────────────┘ ◄────── └─────────┘
                 {ok:true}                          message_id
```

Секреты (`TG_BOT_TOKEN`, `TG_CHAT_ID`) живут только на сервере. Клиентский бандл не содержит ни токена, ни даже URL Telegram API — проверено `grep`-ом в `dist/`.

Второй путь — запись прямо в боте через вебхук:

```
Telegram ──webhook──►  api/bot.js (grammY)
                         │  проверка secretToken
                         │  сессия ⇄ Upstash Redis
                         └──► готовая заявка ──► TG_CHAT_ID
```

`api/bot.js` — **закоммиченный артефакт** сборки esbuild из `bot/*.ts` (Vercel читает функции из git, не из build-output). После правок в `bot/` нужно `npm run build:bot` и закоммитить обновлённый `api/bot.js`.

## Запуск локально

### Только фронт (без Vercel Function)

```bash
npm install
npm run dev
```

Откроется `http://localhost:5173/`. Лендинг видно, но форма отвалится с `404` на `/api/booking` — функции эмулирует только `vercel dev`.

### Полная эмуляция (фронт + функция)

```bash
npm install
cp .env.example .env   # подставить TG_BOT_TOKEN и TG_CHAT_ID
npx vercel login       # один раз — авторизация через браузер
npx vercel dev         # стартует Vite + локальную эмуляцию api/
```

### Бот (после правок в `bot/`)

```bash
npm run build:bot                                # пересобрать api/bot.js (обязательно перед коммитом)
npm run set-webhook -- <https-url>/api/bot       # разово зарегистрировать вебхук
```

## Деплой на Vercel

1. Запушить репо на GitHub.
2. На `vercel.com` → **New Project** → импортировать репозиторий.
3. Framework Preset — Vite (определится автоматически).
4. **Settings → Environment Variables**: добавить `TG_BOT_TOKEN` и `TG_CHAT_ID`.
5. **Deploy**. Через минуту получаешь HTTPS-ссылку `*.vercel.app`.

Каждый `git push origin master` после этого автоматически пересобирает и публикует.

## Переменные окружения

| Переменная | Где задаётся | Назначение |
|---|---|---|
| `TG_BOT_TOKEN` | `.env` локально / Vercel Env в проде | Токен бота из @BotFather |
| `TG_CHAT_ID` | `.env` локально / Vercel Env в проде | ID администратора, куда падают заявки |
| `TG_WEBHOOK_SECRET` | `.env` локально / Vercel Env в проде | Секрет вебхука бота (сверяется с заголовком Telegram) |
| `UPSTASH_REDIS_REST_URL` | `.env` локально / Vercel Env в проде | REST-эндпоинт Upstash Redis (сессии бота) |
| `UPSTASH_REDIS_REST_TOKEN` | `.env` локально / Vercel Env в проде | Токен доступа к Upstash Redis |

Префикса `VITE_` **нет** намеренно — переменные с этим префиксом Vite встраивает в публичный бандл.

## Структура

```
barbershop-landing/
├── api/
│   ├── booking.js          ← serverless function: заявка с формы → TG
│   └── bot.js              ← артефакт esbuild (вебхук бота, не редактировать)
├── bot/                    ← исходники grammY-бота (TypeScript)
│   ├── webhook.ts          ← точка входа
│   ├── bot.ts, data.ts, types.ts, storage.ts, keyboards.ts, notify.ts
│   └── handlers/           ← menu.ts + booking.ts (флоу записи)
├── scripts/
│   ├── build-bot.mjs       ← esbuild bot/webhook.ts → api/bot.js
│   └── set-webhook.mjs     ← регистрация вебхука
├── public/
│   └── favicon.svg
├── src/
│   ├── main.js             ← обработка формы, POST /api/booking
│   └── style.css           ← Tailwind + дизайн-токены
├── index.html              ← все секции лендинга
├── package.json
├── vite.config.js
├── tsconfig.json           ← проверка типов bot/**/*.ts
├── .env.example            ← шаблон переменных
└── README.md
```

## Контент

Текст, цены, имена барберов и адрес — шаблонные, под демо-портфолио. Замените `index.html` под реального заказчика.

## Лицензия

MIT.
