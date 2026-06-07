import { Composer } from 'grammy'
import type { MyContext, BookingDraft } from '../types'
import { serviceById, barberById, barberName, formatPrice, ANY_BARBER, SHOP } from '../data'
import {
  servicesKb, barbersKb, daysKb, timesKb, confirmKb, phoneKb, mainMenuKb, dayLabel,
} from '../keyboards'
import { notifyAdmin } from '../notify'

export const booking = new Composer<MyContext>()

// ─── 0. Старт записи ───
booking.callbackQuery('menu:book', async (ctx) => {
  await ctx.answerCallbackQuery()
  ctx.session.draft = { step: 'service' }
  await ctx.editMessageText('✂️ Шаг 1 из 4 — выбери услугу:', { reply_markup: servicesKb() })
})

// ─── 1. Услуга → барбер ───
booking.callbackQuery(/^bk:svc:(.+)$/, async (ctx) => {
  const svc = serviceById(ctx.match[1])
  if (!svc) return ctx.answerCallbackQuery({ text: 'Услуга не найдена', show_alert: true })
  await ctx.answerCallbackQuery()
  ctx.session.draft.service = svc.id
  ctx.session.draft.step = 'barber'
  await ctx.editMessageText(
    `Услуга: <b>${svc.name}</b>\n\n👤 Шаг 2 из 4 — выбери мастера:`,
    { parse_mode: 'HTML', reply_markup: barbersKb() },
  )
})

booking.callbackQuery('bk:back:service', async (ctx) => {
  await ctx.answerCallbackQuery()
  ctx.session.draft.step = 'service'
  await ctx.editMessageText('✂️ Шаг 1 из 4 — выбери услугу:', { reply_markup: servicesKb() })
})

// ─── 2. Барбер → день ───
booking.callbackQuery(/^bk:brb:(.+)$/, async (ctx) => {
  const id = ctx.match[1]
  if (id !== ANY_BARBER.id && !barberById(id)) {
    return ctx.answerCallbackQuery({ text: 'Мастер не найден', show_alert: true })
  }
  await ctx.answerCallbackQuery()
  ctx.session.draft.barber = id
  ctx.session.draft.step = 'day'
  await ctx.editMessageText(
    `Мастер: <b>${barberName(id)}</b>\n\n📅 Шаг 3 из 4 — выбери день:`,
    { parse_mode: 'HTML', reply_markup: daysKb() },
  )
})

booking.callbackQuery('bk:back:barber', async (ctx) => {
  await ctx.answerCallbackQuery()
  ctx.session.draft.step = 'barber'
  await ctx.editMessageText('👤 Шаг 2 из 4 — выбери мастера:', { reply_markup: barbersKb() })
})

// ─── 3. День → время ───
booking.callbackQuery(/^bk:day:(\d{4}-\d{2}-\d{2})$/, async (ctx) => {
  await ctx.answerCallbackQuery()
  const iso = ctx.match[1]
  ctx.session.draft.day = iso
  ctx.session.draft.step = 'time'
  await ctx.editMessageText(
    `День: <b>${dayLabel(iso)}</b>\n\n🕐 Шаг 4 из 4 — выбери время:`,
    { parse_mode: 'HTML', reply_markup: timesKb() },
  )
})

booking.callbackQuery('bk:back:day', async (ctx) => {
  await ctx.answerCallbackQuery()
  ctx.session.draft.step = 'day'
  await ctx.editMessageText('📅 Шаг 3 из 4 — выбери день:', { reply_markup: daysKb() })
})

// ─── 4. Время → запрос телефона ───
booking.callbackQuery(/^bk:time:(\d{1,2})$/, async (ctx) => {
  await ctx.answerCallbackQuery()
  ctx.session.draft.time = `${ctx.match[1].padStart(2, '0')}:00`
  ctx.session.draft.step = 'phone'
  await ctx.editMessageText('Почти готово! Остался телефон 📱')
  await ctx.reply(
    'Нажми кнопку ниже, чтобы поделиться номером — перезвоним и подтвердим запись.',
    { reply_markup: phoneKb() },
  )
})

// ─── 5. Контакт → сводка и подтверждение ───
booking.on('message:contact', async (ctx) => {
  const d = ctx.session.draft
  if (d.step !== 'phone') return // контакт прислали вне флоу — мягко игнорируем
  d.phone = ctx.message.contact.phone_number
  d.name = ctx.message.contact.first_name ?? ctx.from.first_name
  d.step = 'confirm'
  await ctx.reply('Проверь запись 👇', { reply_markup: { remove_keyboard: true } })
  await ctx.reply(summary(d), { parse_mode: 'HTML', reply_markup: confirmKb() })
})

// ─── 6. Подтверждение → заявка админу ───
booking.callbackQuery('bk:confirm', async (ctx) => {
  const d = ctx.session.draft
  if (d.step !== 'confirm') {
    return ctx.answerCallbackQuery({ text: 'Запись устарела — начни заново', show_alert: true })
  }
  await ctx.answerCallbackQuery('Отправляем…')
  try {
    await notifyAdmin(ctx, d)
  } catch (e) {
    console.error('notifyAdmin failed:', e)
    await ctx.editMessageText(`Не удалось отправить заявку 😔\nПозвони нам: ${SHOP.phone}`)
    return
  }
  ctx.session.draft = { step: 'idle' }
  await ctx.editMessageText(
    '✅ <b>Заявка принята!</b>\n\nПерезвоним в течение 10 минут, подтвердим мастера и точное время.',
    { parse_mode: 'HTML', reply_markup: mainMenuKb() },
  )
})

booking.callbackQuery('bk:restart', async (ctx) => {
  await ctx.answerCallbackQuery()
  ctx.session.draft = { step: 'service' }
  await ctx.editMessageText('✂️ Шаг 1 из 4 — выбери услугу:', { reply_markup: servicesKb() })
})

function summary(d: BookingDraft): string {
  const svc = d.service ? serviceById(d.service) : undefined
  return [
    '📋 <b>Твоя запись</b>',
    '',
    `<b>Услуга:</b> ${svc ? `${svc.name} · ${formatPrice(svc.price)}` : '—'}`,
    `<b>Мастер:</b> ${d.barber ? barberName(d.barber) : '—'}`,
    `<b>Дата:</b> ${d.day ? dayLabel(d.day) : '—'}`,
    `<b>Время:</b> ${d.time ?? '—'}`,
    `<b>Имя:</b> ${d.name ?? '—'}`,
    `<b>Телефон:</b> ${d.phone ?? '—'}`,
    '',
    '<i>Время предпочтительное — подтвердим по телефону.</i>',
  ].join('\n')
}
