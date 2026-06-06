import './style.css'

const form    = document.getElementById('booking-form')
const button  = document.getElementById('submit-btn')
const status  = document.getElementById('form-status')

const STATES = {
  idle:    { text: '',                                                 color: '' },
  sending: { text: 'Отправляем…',                                       color: 'text-text-muted' },
  ok:      { text: 'Заявка отправлена. Перезвоним в течение 10 минут.', color: 'text-bronze' },
  err:     { text: 'Не удалось отправить. Позвоните +7 (812) 000-00-00.', color: 'text-red-400' },
  badData: { text: 'Заполните имя, телефон и услугу.',                  color: 'text-red-400' },
}

function setState (key) {
  status.className = `min-h-[1.5rem] text-sm ${STATES[key].color}`
  status.textContent = STATES[key].text
}

async function submitBooking (payload) {
  const res = await fetch('/api/booking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.ok) throw new Error(data.error || `http_${res.status}`)
  return data
}

form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const data = Object.fromEntries(new FormData(form))
  if (!data.name || data.name.trim().length < 2 || !data.phone || !data.service) {
    setState('badData')
    return
  }

  button.disabled = true
  setState('sending')

  try {
    await submitBooking(data)
    form.reset()
    setState('ok')
  } catch (err) {
    console.error(err)
    setState('err')
  } finally {
    button.disabled = false
  }
})
