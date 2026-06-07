const TOKEN   = process.env.TG_BOT_TOKEN
const CHAT_ID = process.env.TG_CHAT_ID

function esc (s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function formatMessage ({ name, phone, service, when }) {
  return [
    '🪒 <b>Новая заявка с лендинга</b>',
    '',
    `<b>Имя:</b> ${esc(name)}`,
    `<b>Телефон:</b> ${esc(phone)}`,
    `<b>Услуга:</b> ${esc(service)}`,
    when ? `<b>Удобное время:</b> ${esc(when)}` : null,
  ].filter(Boolean).join('\n')
}

export default async function handler (req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' })
  }
  if (!TOKEN || !CHAT_ID) {
    return res.status(500).json({ ok: false, error: 'env_not_configured' })
  }

  const { name, phone, service, when } = req.body ?? {}
  if (!name || String(name).trim().length < 2 || !phone || !service) {
    return res.status(400).json({ ok: false, error: 'invalid_payload' })
  }

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: formatMessage({ name, phone, service, when }),
        parse_mode: 'HTML',
      }),
    })
    const data = await tgRes.json()
    if (!tgRes.ok || !data.ok) {
      console.error('Telegram API error:', data)
      return res.status(502).json({ ok: false, error: 'telegram_failed' })
    }
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Booking handler error:', err)
    return res.status(500).json({ ok: false, error: 'internal' })
  }
}
