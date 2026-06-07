import { webhookCallback } from 'grammy'
import { bot } from '../bot/bot'

// Webhook-endpoint бота на Vercel serverless.
// Адаптер 'https' принимает (req, res) Node-функции Vercel.
// secretToken сверяется с заголовком X-Telegram-Bot-Api-Secret-Token —
// тот же секрет передаётся в setWebhook (scripts/set-webhook.mjs),
// чтобы чужие POST на /api/bot отсекались.
export default webhookCallback(bot, 'https', {
  secretToken: process.env.TG_WEBHOOK_SECRET,
})
