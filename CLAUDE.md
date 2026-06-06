# Brick & Razor — лендинг барбершопа

## Что это

Демонстрационный лендинг мужского барбершопа в Санкт-Петербурге. Часть фриланс-портфолио для Kwork.ru / FL.ru. Контент шаблонный — название, адрес, имена барберов, цены — рассчитан под замену под реального заказчика find&replace.

**Live:** https://barbershop-landing-wheat.vercel.app
**Бот для приёма заявок:** @brick_razor_booking_bot

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

## Переменные окружения

| Имя | Где | Назначение |
|---|---|---|
| `TG_BOT_TOKEN` | `.env` локально, Vercel Env в проде | Токен из @BotFather |
| `TG_CHAT_ID` | то же | Куда падают заявки (telegram chat id админа) |

`.env` в `.gitignore`. Шаблон — `.env.example`.

## Структура

```
barbershop-landing/
├── api/booking.js          ← serverless function — валидация + POST в Telegram
├── public/favicon.svg      ← брендовый B&R на тёмном фоне
├── src/
│   ├── main.js             ← обработчик формы, POST /api/booking
│   └── style.css           ← @import "tailwindcss" + дизайн-токены в @theme
├── index.html              ← все секции на одной странице
├── vite.config.js          ← плагин @tailwindcss/vite
├── package.json
├── .env / .env.example
└── README.md
```

## Команды

```bash
npm install
npm run dev        # Vite на http://localhost:5173/ — фронт работает, /api/booking падает 404
npm run build      # сборка в dist/
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

## Контекст про Рому (владельца репо)

- Backend-разработчик (Java + Python), сейчас идёт во фриланс, собирает портфолио для Kwork.ru / FL.ru.
- Этот лендинг — первый пункт контр-плана из 3 проектов под Web-усиление. Следующий — FastAPI + Vue/Vuetify дашборд.
- Использует Claude Code как со-разработчика, обращается на «бро / братишка».

## Ссылки

- Репо: https://github.com/romankibenko/barbershop-landing
- Live: https://barbershop-landing-wheat.vercel.app
