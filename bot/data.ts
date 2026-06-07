// Единый источник правды о барбершопе. Синхронен с index.html —
// при изменении цен/мастеров правим здесь И на лендинге.

export interface Service {
  id: string
  name: string
  price: number // рубли
  desc: string
}

export interface Barber {
  id: string
  name: string
  role: string
  bio: string
}

export const SERVICES: Service[] = [
  { id: 'haircut',   name: 'Мужская стрижка',        price: 2200, desc: 'Машинка + ножницы, укладка, мытьё, тёплое полотенце.' },
  { id: 'combo',     name: 'Стрижка + борода',       price: 3500, desc: 'Комбо: стрижка под скульптуру бороды. Экономия 700 ₽.' },
  { id: 'camo',      name: 'Камуфляж бороды',        price: 2000, desc: 'Натуральная коррекция седины. Держится 3–4 недели.' },
  { id: 'shave',     name: 'Бритьё опасной бритвой', price: 1800, desc: 'Классический ритуал: компрессы, масло, бритва, бальзам.' },
  { id: 'kids',      name: 'Детская стрижка',        price: 1500, desc: 'До 12 лет. Мультики на экране, какао после.' },
  { id: 'fatherson', name: 'Отец и сын',             price: 3300, desc: 'Стрижка для двоих в один визит. Соседние кресла.' },
]

export const BARBERS: Barber[] = [
  { id: 'volkov',  name: 'Андрей Волков',  role: 'старший барбер',  bio: '8 лет в профессии. Old School, Skin Fade, классические мужские стрижки. Сертификат American Crew Academy.' },
  { id: 'sazonov', name: 'Михаил Сазонов', role: 'мастер бороды',   bio: '6 лет, обучался у Murdock London. Скульптура бороды, камуфляж, классическое бритьё опасной бритвой.' },
  { id: 'kareev',  name: 'Денис Кареев',   role: 'fade-специалист', bio: '5 лет, чемпион OMC Hairworld Junior 2023. Точные fade-переходы, геометрические линии, дизайнерские проборы.' },
]

export const SHOP = {
  name: 'Brick & Razor',
  address: 'Санкт-Петербург, Большая Морская, 24',
  phone: '+7 (812) 000-00-00',
  hours: 'Ежедневно 10:00–22:00',
  mapUrl: 'https://yandex.ru/maps/?text=Санкт-Петербург,+Большая+Морская,+24',
}

// «Любой мастер» — псевдо-барбер для флоу записи.
export const ANY_BARBER = { id: 'any', name: 'Любой мастер' } as const

// Часы приёма записи: слоты каждый час, последний за час до закрытия.
export const SLOT_HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]

export const serviceById = (id: string): Service | undefined =>
  SERVICES.find((s) => s.id === id)

export const barberById = (id: string): Barber | undefined =>
  BARBERS.find((b) => b.id === id)

export const barberName = (id: string): string =>
  id === ANY_BARBER.id ? ANY_BARBER.name : (barberById(id)?.name ?? '—')

export const formatPrice = (rub: number): string =>
  `${rub.toLocaleString('ru-RU')} ₽`
