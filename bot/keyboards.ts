import { InlineKeyboard, Keyboard } from 'grammy'
import { SERVICES, BARBERS, ANY_BARBER, SLOT_HOURS, formatPrice } from './data'

// ─── Главное меню и навигация ───

export function mainMenuKb(): InlineKeyboard {
  return new InlineKeyboard()
    .text('📅 Записаться', 'menu:book').row()
    .text('✂️ Услуги и цены', 'menu:services')
    .text('👤 Барберы', 'menu:barbers').row()
    .text('📍 Адрес и часы', 'menu:address')
    .text('📞 Контакты', 'menu:contacts')
}

export function backToMenuKb(): InlineKeyboard {
  return new InlineKeyboard().text('‹ В меню', 'menu:home')
}

// ─── Шаги записи ───

export function servicesKb(): InlineKeyboard {
  const kb = new InlineKeyboard()
  for (const s of SERVICES) {
    kb.text(`${s.name} · ${formatPrice(s.price)}`, `bk:svc:${s.id}`).row()
  }
  return kb.text('‹ В меню', 'menu:home')
}

export function barbersKb(): InlineKeyboard {
  const kb = new InlineKeyboard()
  for (const b of BARBERS) {
    kb.text(`${b.name} · ${b.role}`, `bk:brb:${b.id}`).row()
  }
  return kb
    .text('💈 Любой мастер', `bk:brb:${ANY_BARBER.id}`).row()
    .text('‹ Услуга', 'bk:back:service')
}

export function daysKb(): InlineKeyboard {
  const kb = new InlineKeyboard()
  nextDays(7).forEach((d, i) => {
    kb.text(d.label, `bk:day:${d.iso}`)
    if (i % 2 === 1) kb.row()
  })
  return kb.row().text('‹ Барбер', 'bk:back:barber')
}

export function timesKb(): InlineKeyboard {
  const kb = new InlineKeyboard()
  SLOT_HOURS.forEach((h, i) => {
    kb.text(`${pad(h)}:00`, `bk:time:${h}`)
    if (i % 3 === 2) kb.row()
  })
  return kb.row().text('‹ День', 'bk:back:day')
}

export function confirmKb(): InlineKeyboard {
  return new InlineKeyboard()
    .text('✅ Подтвердить запись', 'bk:confirm').row()
    .text('✏️ Начать заново', 'bk:restart')
}

// Reply-клавиатура: нативная кнопка «поделиться контактом».
// Телефон приходит отдельным сообщением типа `contact`.
export function phoneKb(): Keyboard {
  return new Keyboard()
    .requestContact('📱 Поделиться номером')
    .resized()
    .oneTime()
}

// ─── Помощники дат (часовой пояс МСК, UTC+3) ───

const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']
const MO = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const MSK = 3 * 3_600_000
const pad = (n: number) => String(n).padStart(2, '0')

function nextDays(n: number): { iso: string; label: string }[] {
  const out: { iso: string; label: string }[] = []
  // Сдвигаем в МСК: дальше работаем через getUTC* как с локальным временем.
  const base = new Date(Date.now() + MSK)
  for (let i = 0; i < n; i++) {
    const d = new Date(base.getTime() + i * 86_400_000)
    const iso = d.toISOString().slice(0, 10)
    const label =
      i === 0 ? 'Сегодня'
      : i === 1 ? 'Завтра'
      : `${WD[d.getUTCDay()]}, ${d.getUTCDate()} ${MO[d.getUTCMonth()]}`
    out.push({ iso, label })
  }
  return out
}

// Человекочитаемая дата по ISO — для сводки подтверждения.
export function dayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return `${WD[d.getUTCDay()]}, ${d.getUTCDate()} ${MO[d.getUTCMonth()]}`
}
