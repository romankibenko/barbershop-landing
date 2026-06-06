import './style.css'

const BOT_TOKEN = import.meta.env.VITE_TG_BOT_TOKEN
const CHAT_ID   = import.meta.env.VITE_TG_CHAT_ID

const form    = document.getElementById('booking-form')
const button  = document.getElementById('submit-btn')
const status  = document.getElementById('form-status')

const STATES = {
  idle:    { text: '',                                                 color: '' },
  sending: { text: 'Отправляем…',                                       color: 'text-text-muted' },
  ok:      { text: 'Заявка отправлена. Перезвоним в течение 10 минут.', color: 'text-bronze' },
  err:     { text: 'Не удалось отправить. Позвоните +7 (495) 000-00-00.', color: 'text-red-400' },
  badEnv:  { text: 'Форма не настроена. Сообщите администратору сайта.', color: 'text-red-400' },
}

function setState (key) {
  status.className = `min-h-[1.5rem] text-sm ${STATES[key].color}`
  status.textContent = STATES[key].text
}

function formatMessage ({ name, phone, service, when }) {
  return [
    '🪒 <b>Новая заявка с лендинга</b>',
    '',
    `<b>Имя:</b> ${name}`,
    `<b>Телефон:</b> ${phone}`,
    `<b>Услуга:</b> ${service}`,
    when ? `<b>Удобное время:</b> ${when}` : null,
  ].filter(Boolean).join('\n')
}

async function sendToTelegram (payload) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: formatMessage(payload),
      parse_mode: 'HTML',
    }),
  })
  if (!res.ok) throw new Error(`Telegram API: ${res.status}`)
  const data = await res.json()
  if (!data.ok) throw new Error(`Telegram API: ${data.description}`)
  return data
}

form.addEventListener('submit', async (e) => {
  e.preventDefault()

  if (!BOT_TOKEN || !CHAT_ID) {
    setState('badEnv')
    return
  }

  const data = Object.fromEntries(new FormData(form))
  if (!data.name || data.name.trim().length < 2 || !data.phone || !data.service) {
    setState('err')
    return
  }

  button.disabled = true
  setState('sending')

  try {
    await sendToTelegram(data)
    form.reset()
    setState('ok')
  } catch (err) {
    console.error(err)
    setState('err')
  } finally {
    button.disabled = false
  }
})
