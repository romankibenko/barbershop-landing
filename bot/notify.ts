import type { MyContext, BookingDraft } from './types'
import { serviceById, barberName, formatPrice } from './data'
import { dayLabel } from './keyboards'

const ADMIN_CHAT_ID = process.env.TG_CHAT_ID

// Шлёт готовую заявку администратору в тот же чат, куда падают заявки
// с формы лендинга (api/booking.js). Используем ctx.api — тот же токен бота.
export async function notifyAdmin(ctx: MyContext, d: BookingDraft): Promise<void> {
  if (!ADMIN_CHAT_ID) {
    console.error('TG_CHAT_ID is unset — заявка из бота не доставлена')
    throw new Error('admin_chat_unset')
  }

  const svc = d.service ? serviceById(d.service) : undefined
  const username = ctx.from?.username ? `@${ctx.from.username}` : '—'

  const text = [
    '🪒 <b>Новая запись из бота</b>',
    '',
    `<b>Услуга:</b> ${svc ? `${svc.name} · ${formatPrice(svc.price)}` : '—'}`,
    `<b>Мастер:</b> ${d.barber ? barberName(d.barber) : '—'}`,
    `<b>Дата:</b> ${d.day ? dayLabel(d.day) : '—'}`,
    `<b>Время:</b> ${d.time ?? '—'} <i>(предпочтительное)</i>`,
    `<b>Имя:</b> ${d.name ?? ctx.from?.first_name ?? '—'}`,
    `<b>Телефон:</b> ${d.phone ?? '—'}`,
    `<b>Telegram:</b> ${username}`,
  ].join('\n')

  await ctx.api.sendMessage(ADMIN_CHAT_ID, text, { parse_mode: 'HTML' })
}
