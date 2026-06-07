import * as esbuild from 'esbuild'

// Бандлит вебхук-бота в один самодостаточный api/bot.js.
//
// Зачем: Vercel компилирует только файлы внутри api/ и НЕ транспилирует
// вынесенную логику (bot/*.ts) — на рантайме это даёт ERR_MODULE_NOT_FOUND.
// Поэтому относительные импорты инлайним здесь, а внешние пакеты
// (grammy, @upstash/redis) оставляем external — они приедут в node_modules.
await esbuild.build({
  entryPoints: ['bot/webhook.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: 'api/bot.js',
  packages: 'external',
  logLevel: 'info',
})

console.log('✅ api/bot.js собран')
