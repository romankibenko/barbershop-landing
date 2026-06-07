import { Composer, InlineKeyboard } from 'grammy'
import type { MyContext } from '../types'
import { SERVICES, BARBERS, SHOP, formatPrice } from '../data'
import { mainMenuKb, backToMenuKb } from '../keyboards'

export const menu = new Composer<MyContext>()

const WELCOME = [
  `💈 <b>${SHOP.name}</b>`,
  'Мужской барбершоп в центре Санкт-Петербурга.',
  '',
  'Выбери, что нужно:',
].join('\n')

// Кнопка «Записаться» + возврат в меню — переиспользуется в инфо-разделах.
const infoKb = () =>
  new InlineKeyboard().text('📅 Записаться', 'menu:book').row().text('‹ В меню', 'menu:home')

async function showMenu(ctx: MyContext, edit: boolean): Promise<void> {
  ctx.session.draft = { step: 'idle' } // сброс черновика при заходе в меню
  if (edit && ctx.callbackQuery) {
    await ctx.editMessageText(WELCOME, { parse_mode: 'HTML', reply_markup: mainMenuKb() })
  } else {
    await ctx.reply(WELCOME, { parse_mode: 'HTML', reply_markup: mainMenuKb() })
  }
}

menu.command('start', (ctx) => showMenu(ctx, false))

menu.callbackQuery('menu:home', async (ctx) => {
  await ctx.answerCallbackQuery()
  await showMenu(ctx, true)
})

menu.callbackQuery('menu:services', async (ctx) => {
  await ctx.answerCallbackQuery()
  const text = [
    '✂️ <b>Услуги и цены</b>',
    '',
    ...SERVICES.map((s) => `<b>${s.name}</b> — ${formatPrice(s.price)}\n<i>${s.desc}</i>`),
  ].join('\n\n')
  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: infoKb() })
})

menu.callbackQuery('menu:barbers', async (ctx) => {
  await ctx.answerCallbackQuery()
  const text = [
    '👤 <b>Наши барберы</b>',
    '',
    ...BARBERS.map((b) => `<b>${b.name}</b> · ${b.role}\n<i>${b.bio}</i>`),
  ].join('\n\n')
  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: infoKb() })
})

menu.callbackQuery('menu:address', async (ctx) => {
  await ctx.answerCallbackQuery()
  const text = ['📍 <b>Адрес и часы</b>', '', SHOP.address, SHOP.hours].join('\n')
  await ctx.editMessageText(text, {
    parse_mode: 'HTML',
    reply_markup: new InlineKeyboard().url('🗺 На карте', SHOP.mapUrl).row().text('‹ В меню', 'menu:home'),
  })
})

menu.callbackQuery('menu:contacts', async (ctx) => {
  await ctx.answerCallbackQuery()
  const text = ['📞 <b>Контакты</b>', '', `Телефон: ${SHOP.phone}`, SHOP.address, SHOP.hours].join('\n')
  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: backToMenuKb() })
})
