// Регистрирует webhook бота на Vercel-функцию /api/bot.
//
// Запуск:
//   node scripts/set-webhook.mjs https://<твой-домен>.vercel.app
// URL можно не передавать, если в .env задан PUBLIC_URL.
//
// Скрипт сам подхватывает переменные из .env (без зависимостей).

import { readFileSync } from 'node:fs'

// --- мини-парсер .env (dotenv не тащим ради одного скрипта) ---
try {
  const raw = readFileSync(new URL('../.env', import.meta.url), 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  // .env может отсутствовать (например, в CI) — берём из окружения
}

const TOKEN = process.env.TG_BOT_TOKEN
const SECRET = process.env.TG_WEBHOOK_SECRET
const base = process.argv[2] || process.env.PUBLIC_URL

if (!TOKEN) {
  console.error('❌ TG_BOT_TOKEN не задан (в .env или окружении)')
  process.exit(1)
}
if (!base) {
  console.error('❌ Укажи URL: node scripts/set-webhook.mjs https://app.vercel.app')
  process.exit(1)
}
if (!SECRET) {
  console.warn('⚠️  TG_WEBHOOK_SECRET не задан — вебхук будет без защиты секретом')
}

const url = `${base.replace(/\/$/, '')}/api/bot`

const res = await fetch(`https://api.telegram.org/bot${TOKEN}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url,
    secret_token: SECRET || undefined,
    // Боту нужны только сообщения и нажатия кнопок — остальное не шлём.
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: true,
  }),
})

const data = await res.json()
if (data.ok) {
  console.log(`✅ Webhook установлен: ${url}`)
} else {
  console.error(`❌ Ошибка setWebhook: ${JSON.stringify(data)}`)
  process.exit(1)
}
