import { Redis } from '@upstash/redis'
import type { StorageAdapter } from 'grammy'

// Кастомный адаптер сессий поверх Upstash Redis (HTTP/REST).
//
// Почему не @grammyjs/storage-redis: тот работает через ioredis (TCP-сокет),
// что плохо для эфемерных serverless-функций — каждый холодный старт открывает
// новое соединение и упирается в лимиты Redis по коннектам. Upstash REST —
// обычный stateless HTTP-запрос, ровно под Vercel.
//
// @upstash/redis сам сериализует/десериализует JSON, так что read/write
// работают с объектами напрямую.
export class UpstashAdapter<T> implements StorageAdapter<T> {
  private redis = Redis.fromEnv() // UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
  private prefix = 'sess:'

  // TTL чистит брошенные черновики записи — если клиент бросил флоу на полпути,
  // через 30 минут состояние само удалится.
  constructor(private ttlSeconds = 30 * 60) {}

  async read(key: string): Promise<T | undefined> {
    const value = await this.redis.get<T>(this.prefix + key)
    return value ?? undefined
  }

  async write(key: string, value: T): Promise<void> {
    await this.redis.set(this.prefix + key, value, { ex: this.ttlSeconds })
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(this.prefix + key)
  }
}
