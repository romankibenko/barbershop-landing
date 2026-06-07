# Brick & Razor — лендинг барбершопа

## Что это

Демонстрационный лендинг мужского барбершопа в Санкт-Петербурге. Часть фриланс-портфолио для Kwork.ru / FL.ru. Контент шаблонный — название, адрес, имена барберов, цены — рассчитан под замену под реального заказчика find&replace.

**Live:** https://barbershop-landing-wheat.vercel.app
**Бот:** @brick_razor_booking_bot — принимает заявки с формы лендинга **и** ведёт запись клиента целиком в чате (см. «Клиентский Telegram-бот» ниже).

## Стек

- **Vite 8** — dev-сервер и сборка
- **Tailwind CSS v4** через `@tailwindcss/vite` (токены в `src/style.css` через `@theme`)
- **Vanilla JS** ES-модули (без React/Vue)
- **Vercel Functions** (Node.js) — `api/booking.js` принимает заявку и шлёт в Telegram
- **Google Fonts** — Bebas Neue (display), Inter (body), preconnect в `index.html`
- **Unsplash CDN** — фото через `images.unsplash.com` с query-параметрами (`w=`, `q=`, `auto=format`)

## Архитектура — главное правило

**Токен Telegram-бота живёт ТОЛЬКО на сервере.** Фронт ничего о нём не знает.

```
Браузер  ──POST /api/booking──►  Vercel Function ──POST──►  Telegram Bot API
(ничего о токене)                 (читает TG_BOT_TOKEN
                                   из process.env)
```

**КРИТИЧНОЕ ПРАВИЛО:** env-переменные **НЕ префиксуются `VITE_`**. Vite встраивает `VITE_*` переменные прямо в публичный JS-бандл при `npm run build` — токен утечёт в DevTools любого посетителя. Проверка после изменений: `grep` по `dist/` на `8472259` / `api.telegram.org` — НЕ должен находить ничего.

## Клиентский Telegram-бот

Тот же @brick_razor_booking_bot, что принимает заявки с формы, дополнительно ведёт **полную запись клиента в чате**: услуга → барбер → день → время → телефон → подтверждение. Готовая заявка падает админу в `TG_CHAT_ID`.

**Стек бота:**
- **grammY + TypeScript** — исходники в `bot/`, точка входа `bot/webhook.ts` (`webhookCallback`, режим `https`, проверка `secretToken`).
- **Upstash Redis** (HTTP/REST) — хранилище сессий через кастомный `UpstashAdapter` (`bot/storage.ts`). Серверлес-дружелюбно: без TCP-коннектов. Ключ сессии — per-user (`ctx.from.id`), TTL 30 мин.
- **esbuild** — бандлит `bot/webhook.ts` → `api/bot.js` (`npm run build:bot`).

**КРИТИЧНОЕ ПРАВИЛО — `api/bot.js` это закоммиченный артефакт сборки, НЕ редактировать руками.**

Vercel детектит функции из **git-исходников**, а не из build-output, и **не транспилирует** файлы вне `api/`. Поэтому:
1. Всю логику бота правим в `bot/*.ts`.
2. После правок — `npm run build:bot` (esbuild инлайнит относительные импорты, внешние пакеты оставляет в `node_modules`).
3. **Коммитим обновлённый `api/bot.js`** вместе с изменениями в `bot/`. Забыл пересобрать → в проде поедет старая версия.

`api/bot.js` намеренно **не** в `.gitignore` — без него Vercel не зарегистрирует функцию (404 на вебхуке).

**Схема:**

```
Telegram ──webhook POST──►  /api/bot (api/bot.js, grammY)
(X-Telegram-Bot-Api-          │  проверяет secretToken == TG_WEBHOOK_SECRET
 Secret-Token header)         │  сессия ⇄ Upstash Redis
                              └──► заявка ──► sendMessage в TG_CHAT_ID
```

**Регистрация вебхука** (разово после смены URL/секрета):

```bash
npm run set-webhook -- https://barbershop-landing-wheat.vercel.app/api/bot
```

Скрипт ставит `secret_token`, `allowed_updates: [message, callback_query]`, `drop_pending_updates`.

## Переменные окружения

| Имя | Где | Назначение |
|---|---|---|
| `TG_BOT_TOKEN` | `.env` локально, Vercel Env в проде | Токен из @BotFather |
| `TG_CHAT_ID` | то же | Куда падают заявки (telegram chat id админа) |
| `TG_WEBHOOK_SECRET` | то же | Секрет вебхука — сверяется с заголовком от Telegram |
| `UPSTASH_REDIS_REST_URL` | то же | REST-эндпоинт Upstash Redis (хранилище сессий бота) |
| `UPSTASH_REDIS_REST_TOKEN` | то же | Токен доступа к Upstash Redis |

`.env` в `.gitignore`. Шаблон — `.env.example`. Значения в Vercel Env — **без кавычек**.

## Структура

```
barbershop-landing/
├── api/
│   ├── booking.js          ← serverless function — заявка с формы → Telegram
│   └── bot.js              ← АРТЕФАКТ esbuild (не редактировать!) — webhook бота
├── bot/                    ← исходники grammY-бота (TypeScript)
│   ├── webhook.ts          ← точка входа (webhookCallback)
│   ├── bot.ts              ← сборка бота: session + хендлеры
│   ├── data.ts             ← услуги/барберы/адрес/часы (синк с index.html)
│   ├── types.ts            ← BookingDraft, SessionData, MyContext
│   ├── storage.ts          ← UpstashAdapter (StorageAdapter)
│   ├── keyboards.ts        ← инлайн-клавиатуры флоу записи
│   ├── notify.ts           ← отправка заявки админу
│   └── handlers/           ← menu.ts (меню/инфо) + booking.ts (флоу записи)
├── scripts/
│   ├── build-bot.mjs       ← esbuild bot/webhook.ts → api/bot.js
│   └── set-webhook.mjs     ← регистрация вебхука в Telegram
├── public/favicon.svg      ← брендовый B&R на тёмном фоне
├── src/
│   ├── main.js             ← обработчик формы, POST /api/booking
│   └── style.css           ← @import "tailwindcss" + дизайн-токены в @theme
├── index.html              ← все секции на одной странице
├── vite.config.js          ← плагин @tailwindcss/vite
├── tsconfig.json           ← для bot/**/*.ts (noEmit, проверка типов)
├── package.json
├── .env / .env.example
└── README.md
```

## Команды

```bash
npm install
npm run dev        # Vite на http://localhost:5173/ — фронт работает, /api/booking падает 404
npm run build      # сборка лендинга в dist/
npm run build:bot  # esbuild: bot/webhook.ts → api/bot.js (после ЛЮБОЙ правки в bot/)
npm run set-webhook -- <url>   # регистрация вебхука бота в Telegram
npx vercel dev     # фронт + локальная эмуляция Functions (требует vercel login один раз)
```

## Деплой

GitHub `main` → Vercel автодеплой. Env-переменные прописаны в **Vercel Dashboard → Settings → Environment Variables**. Никаких ручных шагов после `git push`.

## Дизайн-токены (Tailwind v4)

В `src/style.css` через `@theme`:
- `--color-bg` `#0F0E0C` (кирпично-чёрный)
- `--color-surface` / `--color-surface-2` — карточки
- `--color-bronze` `#B8763C` (акцент)
- `--color-text` / `--color-text-muted` — типографика
- `--font-display` Bebas Neue (заголовки), `--font-body` Inter

Использовать через утилиты `bg-bg`, `text-bronze`, `font-display` — Tailwind v4 генерирует их автоматически из переменных `@theme`.

## Что НЕ делать в этом проекте

- ❌ Не добавлять `VITE_` префикс к секретам (токен утечёт в бандл).
- ❌ Не подключать React/Vue/jQuery — намеренно vanilla, лендинг должен грузиться быстро.
- ❌ Не коммитить `.env`, `dist/`, `node_modules/`.
- ❌ Не использовать `<form action=...>` без `preventDefault()` — иначе страница перезагрузится.
- ❌ Не хардкодить адрес/телефон/имена в JS — только в `index.html`, чтобы find&replace работал для следующего заказчика.
- ❌ Не редактировать `api/bot.js` руками — это сгенерированный esbuild артефакт. Правь `bot/*.ts` → `npm run build:bot` → коммить.
- ❌ Не коммитить изменения в `bot/` без пересборки `api/bot.js` — в прод поедет старая версия бота.
- ❌ Не добавлять `api/bot.js` в `.gitignore` — без него Vercel не зарегистрирует функцию (404 на вебхуке).
- ❌ Данные барбершопа в `bot/data.ts` держать синхронными с `index.html` — это два независимых источника одного контента.

## Контекст про Рому (владельца репо)

- Backend-разработчик (Java + Python), сейчас идёт во фриланс, собирает портфолио для Kwork.ru / FL.ru.
- Этот лендинг — первый пункт контр-плана из 3 проектов под Web-усиление. Следующий — FastAPI + Vue/Vuetify дашборд.
- Использует Claude Code как со-разработчика, обращается на «бро / братишка».

## Ссылки

- Репо: https://github.com/romankibenko/barbershop-landing
- Live: https://barbershop-landing-wheat.vercel.app
