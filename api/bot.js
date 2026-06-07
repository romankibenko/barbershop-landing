// bot/webhook.ts
import { webhookCallback } from "grammy";

// bot/bot.ts
import { Bot, session } from "grammy";

// bot/storage.ts
import { Redis } from "@upstash/redis";
var UpstashAdapter = class {
  // TTL чистит брошенные черновики записи — если клиент бросил флоу на полпути,
  // через 30 минут состояние само удалится.
  constructor(ttlSeconds = 30 * 60) {
    this.ttlSeconds = ttlSeconds;
  }
  ttlSeconds;
  redis = Redis.fromEnv();
  // UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
  prefix = "sess:";
  async read(key) {
    const value = await this.redis.get(this.prefix + key);
    return value ?? void 0;
  }
  async write(key, value) {
    await this.redis.set(this.prefix + key, value, { ex: this.ttlSeconds });
  }
  async delete(key) {
    await this.redis.del(this.prefix + key);
  }
};

// bot/handlers/menu.ts
import { Composer, InlineKeyboard as InlineKeyboard2 } from "grammy";

// bot/data.ts
var SERVICES = [
  { id: "haircut", name: "\u041C\u0443\u0436\u0441\u043A\u0430\u044F \u0441\u0442\u0440\u0438\u0436\u043A\u0430", price: 2200, desc: "\u041C\u0430\u0448\u0438\u043D\u043A\u0430 + \u043D\u043E\u0436\u043D\u0438\u0446\u044B, \u0443\u043A\u043B\u0430\u0434\u043A\u0430, \u043C\u044B\u0442\u044C\u0451, \u0442\u0451\u043F\u043B\u043E\u0435 \u043F\u043E\u043B\u043E\u0442\u0435\u043D\u0446\u0435." },
  { id: "combo", name: "\u0421\u0442\u0440\u0438\u0436\u043A\u0430 + \u0431\u043E\u0440\u043E\u0434\u0430", price: 3500, desc: "\u041A\u043E\u043C\u0431\u043E: \u0441\u0442\u0440\u0438\u0436\u043A\u0430 \u043F\u043E\u0434 \u0441\u043A\u0443\u043B\u044C\u043F\u0442\u0443\u0440\u0443 \u0431\u043E\u0440\u043E\u0434\u044B. \u042D\u043A\u043E\u043D\u043E\u043C\u0438\u044F 700 \u20BD." },
  { id: "camo", name: "\u041A\u0430\u043C\u0443\u0444\u043B\u044F\u0436 \u0431\u043E\u0440\u043E\u0434\u044B", price: 2e3, desc: "\u041D\u0430\u0442\u0443\u0440\u0430\u043B\u044C\u043D\u0430\u044F \u043A\u043E\u0440\u0440\u0435\u043A\u0446\u0438\u044F \u0441\u0435\u0434\u0438\u043D\u044B. \u0414\u0435\u0440\u0436\u0438\u0442\u0441\u044F 3\u20134 \u043D\u0435\u0434\u0435\u043B\u0438." },
  { id: "shave", name: "\u0411\u0440\u0438\u0442\u044C\u0451 \u043E\u043F\u0430\u0441\u043D\u043E\u0439 \u0431\u0440\u0438\u0442\u0432\u043E\u0439", price: 1800, desc: "\u041A\u043B\u0430\u0441\u0441\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0440\u0438\u0442\u0443\u0430\u043B: \u043A\u043E\u043C\u043F\u0440\u0435\u0441\u0441\u044B, \u043C\u0430\u0441\u043B\u043E, \u0431\u0440\u0438\u0442\u0432\u0430, \u0431\u0430\u043B\u044C\u0437\u0430\u043C." },
  { id: "kids", name: "\u0414\u0435\u0442\u0441\u043A\u0430\u044F \u0441\u0442\u0440\u0438\u0436\u043A\u0430", price: 1500, desc: "\u0414\u043E 12 \u043B\u0435\u0442. \u041C\u0443\u043B\u044C\u0442\u0438\u043A\u0438 \u043D\u0430 \u044D\u043A\u0440\u0430\u043D\u0435, \u043A\u0430\u043A\u0430\u043E \u043F\u043E\u0441\u043B\u0435." },
  { id: "fatherson", name: "\u041E\u0442\u0435\u0446 \u0438 \u0441\u044B\u043D", price: 3300, desc: "\u0421\u0442\u0440\u0438\u0436\u043A\u0430 \u0434\u043B\u044F \u0434\u0432\u043E\u0438\u0445 \u0432 \u043E\u0434\u0438\u043D \u0432\u0438\u0437\u0438\u0442. \u0421\u043E\u0441\u0435\u0434\u043D\u0438\u0435 \u043A\u0440\u0435\u0441\u043B\u0430." }
];
var BARBERS = [
  { id: "volkov", name: "\u0410\u043D\u0434\u0440\u0435\u0439 \u0412\u043E\u043B\u043A\u043E\u0432", role: "\u0441\u0442\u0430\u0440\u0448\u0438\u0439 \u0431\u0430\u0440\u0431\u0435\u0440", bio: "8 \u043B\u0435\u0442 \u0432 \u043F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u0438. Old School, Skin Fade, \u043A\u043B\u0430\u0441\u0441\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u043C\u0443\u0436\u0441\u043A\u0438\u0435 \u0441\u0442\u0440\u0438\u0436\u043A\u0438. \u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 American Crew Academy." },
  { id: "sazonov", name: "\u041C\u0438\u0445\u0430\u0438\u043B \u0421\u0430\u0437\u043E\u043D\u043E\u0432", role: "\u043C\u0430\u0441\u0442\u0435\u0440 \u0431\u043E\u0440\u043E\u0434\u044B", bio: "6 \u043B\u0435\u0442, \u043E\u0431\u0443\u0447\u0430\u043B\u0441\u044F \u0443 Murdock London. \u0421\u043A\u0443\u043B\u044C\u043F\u0442\u0443\u0440\u0430 \u0431\u043E\u0440\u043E\u0434\u044B, \u043A\u0430\u043C\u0443\u0444\u043B\u044F\u0436, \u043A\u043B\u0430\u0441\u0441\u0438\u0447\u0435\u0441\u043A\u043E\u0435 \u0431\u0440\u0438\u0442\u044C\u0451 \u043E\u043F\u0430\u0441\u043D\u043E\u0439 \u0431\u0440\u0438\u0442\u0432\u043E\u0439." },
  { id: "kareev", name: "\u0414\u0435\u043D\u0438\u0441 \u041A\u0430\u0440\u0435\u0435\u0432", role: "fade-\u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442", bio: "5 \u043B\u0435\u0442, \u0447\u0435\u043C\u043F\u0438\u043E\u043D OMC Hairworld Junior 2023. \u0422\u043E\u0447\u043D\u044B\u0435 fade-\u043F\u0435\u0440\u0435\u0445\u043E\u0434\u044B, \u0433\u0435\u043E\u043C\u0435\u0442\u0440\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u043B\u0438\u043D\u0438\u0438, \u0434\u0438\u0437\u0430\u0439\u043D\u0435\u0440\u0441\u043A\u0438\u0435 \u043F\u0440\u043E\u0431\u043E\u0440\u044B." }
];
var SHOP = {
  name: "Brick & Razor",
  address: "\u0421\u0430\u043D\u043A\u0442-\u041F\u0435\u0442\u0435\u0440\u0431\u0443\u0440\u0433, \u0411\u043E\u043B\u044C\u0448\u0430\u044F \u041C\u043E\u0440\u0441\u043A\u0430\u044F, 24",
  phone: "+7 (812) 000-00-00",
  hours: "\u0415\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u043E 10:00\u201322:00",
  mapUrl: "https://yandex.ru/maps/?text=\u0421\u0430\u043D\u043A\u0442-\u041F\u0435\u0442\u0435\u0440\u0431\u0443\u0440\u0433,+\u0411\u043E\u043B\u044C\u0448\u0430\u044F+\u041C\u043E\u0440\u0441\u043A\u0430\u044F,+24"
};
var ANY_BARBER = { id: "any", name: "\u041B\u044E\u0431\u043E\u0439 \u043C\u0430\u0441\u0442\u0435\u0440" };
var SLOT_HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
var serviceById = (id) => SERVICES.find((s) => s.id === id);
var barberById = (id) => BARBERS.find((b) => b.id === id);
var barberName = (id) => id === ANY_BARBER.id ? ANY_BARBER.name : barberById(id)?.name ?? "\u2014";
var formatPrice = (rub) => `${rub.toLocaleString("ru-RU")} \u20BD`;

// bot/keyboards.ts
import { InlineKeyboard, Keyboard } from "grammy";
function mainMenuKb() {
  return new InlineKeyboard().text("\u{1F4C5} \u0417\u0430\u043F\u0438\u0441\u0430\u0442\u044C\u0441\u044F", "menu:book").row().text("\u2702\uFE0F \u0423\u0441\u043B\u0443\u0433\u0438 \u0438 \u0446\u0435\u043D\u044B", "menu:services").text("\u{1F464} \u0411\u0430\u0440\u0431\u0435\u0440\u044B", "menu:barbers").row().text("\u{1F4CD} \u0410\u0434\u0440\u0435\u0441 \u0438 \u0447\u0430\u0441\u044B", "menu:address").text("\u{1F4DE} \u041A\u043E\u043D\u0442\u0430\u043A\u0442\u044B", "menu:contacts");
}
function backToMenuKb() {
  return new InlineKeyboard().text("\u2039 \u0412 \u043C\u0435\u043D\u044E", "menu:home");
}
function servicesKb() {
  const kb = new InlineKeyboard();
  for (const s of SERVICES) {
    kb.text(`${s.name} \xB7 ${formatPrice(s.price)}`, `bk:svc:${s.id}`).row();
  }
  return kb.text("\u2039 \u0412 \u043C\u0435\u043D\u044E", "menu:home");
}
function barbersKb() {
  const kb = new InlineKeyboard();
  for (const b of BARBERS) {
    kb.text(`${b.name} \xB7 ${b.role}`, `bk:brb:${b.id}`).row();
  }
  return kb.text("\u{1F488} \u041B\u044E\u0431\u043E\u0439 \u043C\u0430\u0441\u0442\u0435\u0440", `bk:brb:${ANY_BARBER.id}`).row().text("\u2039 \u0423\u0441\u043B\u0443\u0433\u0430", "bk:back:service");
}
function daysKb() {
  const kb = new InlineKeyboard();
  nextDays(7).forEach((d, i) => {
    kb.text(d.label, `bk:day:${d.iso}`);
    if (i % 2 === 1) kb.row();
  });
  return kb.row().text("\u2039 \u0411\u0430\u0440\u0431\u0435\u0440", "bk:back:barber");
}
function timesKb() {
  const kb = new InlineKeyboard();
  SLOT_HOURS.forEach((h, i) => {
    kb.text(`${pad(h)}:00`, `bk:time:${h}`);
    if (i % 3 === 2) kb.row();
  });
  return kb.row().text("\u2039 \u0414\u0435\u043D\u044C", "bk:back:day");
}
function confirmKb() {
  return new InlineKeyboard().text("\u2705 \u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C \u0437\u0430\u043F\u0438\u0441\u044C", "bk:confirm").row().text("\u270F\uFE0F \u041D\u0430\u0447\u0430\u0442\u044C \u0437\u0430\u043D\u043E\u0432\u043E", "bk:restart");
}
function phoneKb() {
  return new Keyboard().requestContact("\u{1F4F1} \u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F \u043D\u043E\u043C\u0435\u0440\u043E\u043C").resized().oneTime();
}
var WD = ["\u0432\u0441", "\u043F\u043D", "\u0432\u0442", "\u0441\u0440", "\u0447\u0442", "\u043F\u0442", "\u0441\u0431"];
var MO = ["\u044F\u043D\u0432", "\u0444\u0435\u0432", "\u043C\u0430\u0440", "\u0430\u043F\u0440", "\u043C\u0430\u044F", "\u0438\u044E\u043D", "\u0438\u044E\u043B", "\u0430\u0432\u0433", "\u0441\u0435\u043D", "\u043E\u043A\u0442", "\u043D\u043E\u044F", "\u0434\u0435\u043A"];
var MSK = 3 * 36e5;
var pad = (n) => String(n).padStart(2, "0");
function nextDays(n) {
  const out = [];
  const base = new Date(Date.now() + MSK);
  for (let i = 0; i < n; i++) {
    const d = new Date(base.getTime() + i * 864e5);
    const iso = d.toISOString().slice(0, 10);
    const label = i === 0 ? "\u0421\u0435\u0433\u043E\u0434\u043D\u044F" : i === 1 ? "\u0417\u0430\u0432\u0442\u0440\u0430" : `${WD[d.getUTCDay()]}, ${d.getUTCDate()} ${MO[d.getUTCMonth()]}`;
    out.push({ iso, label });
  }
  return out;
}
function dayLabel(iso) {
  const d = /* @__PURE__ */ new Date(`${iso}T00:00:00Z`);
  return `${WD[d.getUTCDay()]}, ${d.getUTCDate()} ${MO[d.getUTCMonth()]}`;
}

// bot/handlers/menu.ts
var menu = new Composer();
var WELCOME = [
  `\u{1F488} <b>${SHOP.name}</b>`,
  "\u041C\u0443\u0436\u0441\u043A\u043E\u0439 \u0431\u0430\u0440\u0431\u0435\u0440\u0448\u043E\u043F \u0432 \u0446\u0435\u043D\u0442\u0440\u0435 \u0421\u0430\u043D\u043A\u0442-\u041F\u0435\u0442\u0435\u0440\u0431\u0443\u0440\u0433\u0430.",
  "",
  "\u0412\u044B\u0431\u0435\u0440\u0438, \u0447\u0442\u043E \u043D\u0443\u0436\u043D\u043E:"
].join("\n");
var infoKb = () => new InlineKeyboard2().text("\u{1F4C5} \u0417\u0430\u043F\u0438\u0441\u0430\u0442\u044C\u0441\u044F", "menu:book").row().text("\u2039 \u0412 \u043C\u0435\u043D\u044E", "menu:home");
async function showMenu(ctx, edit) {
  ctx.session.draft = { step: "idle" };
  if (edit && ctx.callbackQuery) {
    await ctx.editMessageText(WELCOME, { parse_mode: "HTML", reply_markup: mainMenuKb() });
  } else {
    await ctx.reply(WELCOME, { parse_mode: "HTML", reply_markup: mainMenuKb() });
  }
}
menu.command("start", (ctx) => showMenu(ctx, false));
menu.callbackQuery("menu:home", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showMenu(ctx, true);
});
menu.callbackQuery("menu:services", async (ctx) => {
  await ctx.answerCallbackQuery();
  const text = [
    "\u2702\uFE0F <b>\u0423\u0441\u043B\u0443\u0433\u0438 \u0438 \u0446\u0435\u043D\u044B</b>",
    "",
    ...SERVICES.map((s) => `<b>${s.name}</b> \u2014 ${formatPrice(s.price)}
<i>${s.desc}</i>`)
  ].join("\n\n");
  await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: infoKb() });
});
menu.callbackQuery("menu:barbers", async (ctx) => {
  await ctx.answerCallbackQuery();
  const text = [
    "\u{1F464} <b>\u041D\u0430\u0448\u0438 \u0431\u0430\u0440\u0431\u0435\u0440\u044B</b>",
    "",
    ...BARBERS.map((b) => `<b>${b.name}</b> \xB7 ${b.role}
<i>${b.bio}</i>`)
  ].join("\n\n");
  await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: infoKb() });
});
menu.callbackQuery("menu:address", async (ctx) => {
  await ctx.answerCallbackQuery();
  const text = ["\u{1F4CD} <b>\u0410\u0434\u0440\u0435\u0441 \u0438 \u0447\u0430\u0441\u044B</b>", "", SHOP.address, SHOP.hours].join("\n");
  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: new InlineKeyboard2().url("\u{1F5FA} \u041D\u0430 \u043A\u0430\u0440\u0442\u0435", SHOP.mapUrl).row().text("\u2039 \u0412 \u043C\u0435\u043D\u044E", "menu:home")
  });
});
menu.callbackQuery("menu:contacts", async (ctx) => {
  await ctx.answerCallbackQuery();
  const text = ["\u{1F4DE} <b>\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u044B</b>", "", `\u0422\u0435\u043B\u0435\u0444\u043E\u043D: ${SHOP.phone}`, SHOP.address, SHOP.hours].join("\n");
  await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: backToMenuKb() });
});

// bot/handlers/booking.ts
import { Composer as Composer2 } from "grammy";

// bot/notify.ts
var ADMIN_CHAT_ID = process.env.TG_CHAT_ID;
async function notifyAdmin(ctx, d) {
  if (!ADMIN_CHAT_ID) {
    console.error("TG_CHAT_ID is unset \u2014 \u0437\u0430\u044F\u0432\u043A\u0430 \u0438\u0437 \u0431\u043E\u0442\u0430 \u043D\u0435 \u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0430");
    throw new Error("admin_chat_unset");
  }
  const svc = d.service ? serviceById(d.service) : void 0;
  const username = ctx.from?.username ? `@${ctx.from.username}` : "\u2014";
  const text = [
    "\u{1FA92} <b>\u041D\u043E\u0432\u0430\u044F \u0437\u0430\u043F\u0438\u0441\u044C \u0438\u0437 \u0431\u043E\u0442\u0430</b>",
    "",
    `<b>\u0423\u0441\u043B\u0443\u0433\u0430:</b> ${svc ? `${svc.name} \xB7 ${formatPrice(svc.price)}` : "\u2014"}`,
    `<b>\u041C\u0430\u0441\u0442\u0435\u0440:</b> ${d.barber ? barberName(d.barber) : "\u2014"}`,
    `<b>\u0414\u0430\u0442\u0430:</b> ${d.day ? dayLabel(d.day) : "\u2014"}`,
    `<b>\u0412\u0440\u0435\u043C\u044F:</b> ${d.time ?? "\u2014"} <i>(\u043F\u0440\u0435\u0434\u043F\u043E\u0447\u0442\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0435)</i>`,
    `<b>\u0418\u043C\u044F:</b> ${d.name ?? ctx.from?.first_name ?? "\u2014"}`,
    `<b>\u0422\u0435\u043B\u0435\u0444\u043E\u043D:</b> ${d.phone ?? "\u2014"}`,
    `<b>Telegram:</b> ${username}`
  ].join("\n");
  await ctx.api.sendMessage(ADMIN_CHAT_ID, text, { parse_mode: "HTML" });
}

// bot/handlers/booking.ts
var booking = new Composer2();
booking.callbackQuery("menu:book", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.draft = { step: "service" };
  await ctx.editMessageText("\u2702\uFE0F \u0428\u0430\u0433 1 \u0438\u0437 4 \u2014 \u0432\u044B\u0431\u0435\u0440\u0438 \u0443\u0441\u043B\u0443\u0433\u0443:", { reply_markup: servicesKb() });
});
booking.callbackQuery(/^bk:svc:(.+)$/, async (ctx) => {
  const svc = serviceById(ctx.match[1]);
  if (!svc) return ctx.answerCallbackQuery({ text: "\u0423\u0441\u043B\u0443\u0433\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430", show_alert: true });
  await ctx.answerCallbackQuery();
  ctx.session.draft.service = svc.id;
  ctx.session.draft.step = "barber";
  await ctx.editMessageText(
    `\u0423\u0441\u043B\u0443\u0433\u0430: <b>${svc.name}</b>

\u{1F464} \u0428\u0430\u0433 2 \u0438\u0437 4 \u2014 \u0432\u044B\u0431\u0435\u0440\u0438 \u043C\u0430\u0441\u0442\u0435\u0440\u0430:`,
    { parse_mode: "HTML", reply_markup: barbersKb() }
  );
});
booking.callbackQuery("bk:back:service", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.draft.step = "service";
  await ctx.editMessageText("\u2702\uFE0F \u0428\u0430\u0433 1 \u0438\u0437 4 \u2014 \u0432\u044B\u0431\u0435\u0440\u0438 \u0443\u0441\u043B\u0443\u0433\u0443:", { reply_markup: servicesKb() });
});
booking.callbackQuery(/^bk:brb:(.+)$/, async (ctx) => {
  const id = ctx.match[1];
  if (id !== ANY_BARBER.id && !barberById(id)) {
    return ctx.answerCallbackQuery({ text: "\u041C\u0430\u0441\u0442\u0435\u0440 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D", show_alert: true });
  }
  await ctx.answerCallbackQuery();
  ctx.session.draft.barber = id;
  ctx.session.draft.step = "day";
  await ctx.editMessageText(
    `\u041C\u0430\u0441\u0442\u0435\u0440: <b>${barberName(id)}</b>

\u{1F4C5} \u0428\u0430\u0433 3 \u0438\u0437 4 \u2014 \u0432\u044B\u0431\u0435\u0440\u0438 \u0434\u0435\u043D\u044C:`,
    { parse_mode: "HTML", reply_markup: daysKb() }
  );
});
booking.callbackQuery("bk:back:barber", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.draft.step = "barber";
  await ctx.editMessageText("\u{1F464} \u0428\u0430\u0433 2 \u0438\u0437 4 \u2014 \u0432\u044B\u0431\u0435\u0440\u0438 \u043C\u0430\u0441\u0442\u0435\u0440\u0430:", { reply_markup: barbersKb() });
});
booking.callbackQuery(/^bk:day:(\d{4}-\d{2}-\d{2})$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const iso = ctx.match[1];
  ctx.session.draft.day = iso;
  ctx.session.draft.step = "time";
  await ctx.editMessageText(
    `\u0414\u0435\u043D\u044C: <b>${dayLabel(iso)}</b>

\u{1F550} \u0428\u0430\u0433 4 \u0438\u0437 4 \u2014 \u0432\u044B\u0431\u0435\u0440\u0438 \u0432\u0440\u0435\u043C\u044F:`,
    { parse_mode: "HTML", reply_markup: timesKb() }
  );
});
booking.callbackQuery("bk:back:day", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.draft.step = "day";
  await ctx.editMessageText("\u{1F4C5} \u0428\u0430\u0433 3 \u0438\u0437 4 \u2014 \u0432\u044B\u0431\u0435\u0440\u0438 \u0434\u0435\u043D\u044C:", { reply_markup: daysKb() });
});
booking.callbackQuery(/^bk:time:(\d{1,2})$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.draft.time = `${ctx.match[1].padStart(2, "0")}:00`;
  ctx.session.draft.step = "phone";
  await ctx.editMessageText("\u041F\u043E\u0447\u0442\u0438 \u0433\u043E\u0442\u043E\u0432\u043E! \u041E\u0441\u0442\u0430\u043B\u0441\u044F \u0442\u0435\u043B\u0435\u0444\u043E\u043D \u{1F4F1}");
  await ctx.reply(
    "\u041D\u0430\u0436\u043C\u0438 \u043A\u043D\u043E\u043F\u043A\u0443 \u043D\u0438\u0436\u0435, \u0447\u0442\u043E\u0431\u044B \u043F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F \u043D\u043E\u043C\u0435\u0440\u043E\u043C \u2014 \u043F\u0435\u0440\u0435\u0437\u0432\u043E\u043D\u0438\u043C \u0438 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u043C \u0437\u0430\u043F\u0438\u0441\u044C.",
    { reply_markup: phoneKb() }
  );
});
booking.on("message:contact", async (ctx) => {
  const d = ctx.session.draft;
  if (d.step !== "phone") return;
  d.phone = ctx.message.contact.phone_number;
  d.name = ctx.message.contact.first_name ?? ctx.from.first_name;
  d.step = "confirm";
  await ctx.reply("\u041F\u0440\u043E\u0432\u0435\u0440\u044C \u0437\u0430\u043F\u0438\u0441\u044C \u{1F447}", { reply_markup: { remove_keyboard: true } });
  await ctx.reply(summary(d), { parse_mode: "HTML", reply_markup: confirmKb() });
});
booking.callbackQuery("bk:confirm", async (ctx) => {
  const d = ctx.session.draft;
  if (d.step !== "confirm") {
    return ctx.answerCallbackQuery({ text: "\u0417\u0430\u043F\u0438\u0441\u044C \u0443\u0441\u0442\u0430\u0440\u0435\u043B\u0430 \u2014 \u043D\u0430\u0447\u043D\u0438 \u0437\u0430\u043D\u043E\u0432\u043E", show_alert: true });
  }
  await ctx.answerCallbackQuery("\u041E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u043C\u2026");
  try {
    await notifyAdmin(ctx, d);
  } catch (e) {
    console.error("notifyAdmin failed:", e);
    await ctx.editMessageText(`\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0437\u0430\u044F\u0432\u043A\u0443 \u{1F614}
\u041F\u043E\u0437\u0432\u043E\u043D\u0438 \u043D\u0430\u043C: ${SHOP.phone}`);
    return;
  }
  ctx.session.draft = { step: "idle" };
  await ctx.editMessageText(
    "\u2705 <b>\u0417\u0430\u044F\u0432\u043A\u0430 \u043F\u0440\u0438\u043D\u044F\u0442\u0430!</b>\n\n\u041F\u0435\u0440\u0435\u0437\u0432\u043E\u043D\u0438\u043C \u0432 \u0442\u0435\u0447\u0435\u043D\u0438\u0435 10 \u043C\u0438\u043D\u0443\u0442, \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u043C \u043C\u0430\u0441\u0442\u0435\u0440\u0430 \u0438 \u0442\u043E\u0447\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F.",
    { parse_mode: "HTML", reply_markup: mainMenuKb() }
  );
});
booking.callbackQuery("bk:restart", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.draft = { step: "service" };
  await ctx.editMessageText("\u2702\uFE0F \u0428\u0430\u0433 1 \u0438\u0437 4 \u2014 \u0432\u044B\u0431\u0435\u0440\u0438 \u0443\u0441\u043B\u0443\u0433\u0443:", { reply_markup: servicesKb() });
});
function summary(d) {
  const svc = d.service ? serviceById(d.service) : void 0;
  return [
    "\u{1F4CB} <b>\u0422\u0432\u043E\u044F \u0437\u0430\u043F\u0438\u0441\u044C</b>",
    "",
    `<b>\u0423\u0441\u043B\u0443\u0433\u0430:</b> ${svc ? `${svc.name} \xB7 ${formatPrice(svc.price)}` : "\u2014"}`,
    `<b>\u041C\u0430\u0441\u0442\u0435\u0440:</b> ${d.barber ? barberName(d.barber) : "\u2014"}`,
    `<b>\u0414\u0430\u0442\u0430:</b> ${d.day ? dayLabel(d.day) : "\u2014"}`,
    `<b>\u0412\u0440\u0435\u043C\u044F:</b> ${d.time ?? "\u2014"}`,
    `<b>\u0418\u043C\u044F:</b> ${d.name ?? "\u2014"}`,
    `<b>\u0422\u0435\u043B\u0435\u0444\u043E\u043D:</b> ${d.phone ?? "\u2014"}`,
    "",
    "<i>\u0412\u0440\u0435\u043C\u044F \u043F\u0440\u0435\u0434\u043F\u043E\u0447\u0442\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u2014 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u043C \u043F\u043E \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0443.</i>"
  ].join("\n");
}

// bot/bot.ts
var token = process.env.TG_BOT_TOKEN;
if (!token) throw new Error("TG_BOT_TOKEN is unset");
var bot = new Bot(token);
bot.use(
  session({
    initial: () => ({ draft: { step: "idle" } }),
    getSessionKey: (ctx) => ctx.from?.id.toString(),
    storage: new UpstashAdapter()
  })
);
bot.use(menu);
bot.use(booking);
bot.catch((err) => {
  console.error(`Bot error on update ${err.ctx.update.update_id}:`, err.error);
});

// bot/webhook.ts
var webhook_default = webhookCallback(bot, "https", {
  secretToken: process.env.TG_WEBHOOK_SECRET
});
export {
  webhook_default as default
};
