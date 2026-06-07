import { Bot, session } from 'grammy'
import type { MyContext, SessionData } from './types'
import { UpstashAdapter } from './storage'
import { menu } from './handlers/menu'
import { booking } from './handlers/booking'

const token = process.env.TG_BOT_TOKEN
if (!token) throw new Error('TG_BOT_TOKEN is unset')

export const bot = new Bot<MyContext>(token)

// Сессия per user. На stateless serverless состояние между апдейтами
// негде держать в памяти — поэтому внешний стор (Upstash Redis).
bot.use(
  session({
    initial: (): SessionData => ({ draft: { step: 'idle' } }),
    getSessionKey: (ctx) => ctx.from?.id.toString(),
    storage: new UpstashAdapter<SessionData>(),
  }),
)

bot.use(menu)
bot.use(booking)

// Бот не должен падать на необработанной ошибке — логируем и продолжаем.
bot.catch((err) => {
  console.error(`Bot error on update ${err.ctx.update.update_id}:`, err.error)
})
