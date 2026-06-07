import { webhookCallback } from 'grammy'
import { bot } from './bot'

// Entry-point вебхука. Бандлится esbuild'ом в самодостаточный api/bot.js
// (scripts/build-bot.mjs) — Vercel не транспилирует файлы вне api/, поэтому
// относительные импорты инлайним заранее, а grammy/@upstash резолвим из node_modules.
//
// Адаптер 'https' принимает (req, res) Node-функции Vercel. secretToken
// сверяется с заголовком X-Telegram-Bot-Api-Secret-Token (см. set-webhook.mjs).
export default webhookCallback(bot, 'https', {
  secretToken: process.env.TG_WEBHOOK_SECRET,
})
