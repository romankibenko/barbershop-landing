import type { Context, SessionFlavor } from 'grammy'

// Шаги мастера записи. Состояние живёт в session (Upstash), потому что
// Vercel-функции stateless — между апдейтами в памяти ничего не сохранить.
export type BookingStep =
  | 'idle'
  | 'service'
  | 'barber'
  | 'day'
  | 'time'
  | 'phone'
  | 'confirm'

export interface BookingDraft {
  step: BookingStep
  service?: string // service id
  barber?: string  // barber id | 'any'
  day?: string     // 'YYYY-MM-DD'
  time?: string    // 'HH:MM'
  phone?: string
  name?: string
}

export interface SessionData {
  draft: BookingDraft
}

export type MyContext = Context & SessionFlavor<SessionData>

export const emptyDraft = (): BookingDraft => ({ step: 'idle' })
