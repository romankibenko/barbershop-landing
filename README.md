# Brick & Razor — лендинг мужского барбершопа

**Live:** https://barbershop-landing-wheat.vercel.app

Одностраничный лендинг с записью через Telegram-бот. Бэкенд — serverless-функция на Vercel; токен бота в браузер не утекает.

## Стек

- **Vite 8** — сборщик и dev-сервер
- **Tailwind CSS v4** (через `@tailwindcss/vite`)
- **Vanilla JS** (ES-модули)
- **Vercel Functions** (Node.js) — приём заявок и проксирование в Telegram
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

Префикса `VITE_` **нет** намеренно — переменные с этим префиксом Vite встраивает в публичный бандл.

## Структура

```
barbershop-landing/
├── api/
│   └── booking.js          ← serverless function: валидация + проброс в TG
├── public/
│   └── favicon.svg
├── src/
│   ├── main.js             ← обработка формы, POST /api/booking
│   └── style.css           ← Tailwind + дизайн-токены
├── index.html              ← все секции лендинга
├── package.json
├── vite.config.js
├── .env.example            ← шаблон переменных
└── README.md
```

## Контент

Текст, цены, имена барберов и адрес — шаблонные, под демо-портфолио. Замените `index.html` под реального заказчика.

## Лицензия

MIT.
