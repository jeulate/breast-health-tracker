import { Redis } from "@upstash/redis";
import { getServerEnv } from "@/config/env";

let redisClient: Redis | null = null;

/**
 * Devuelve una instancia singleton del cliente Upstash Redis.
 *
 * Las páginas y Route Handlers deben acceder a Redis mediante
 * repositorios y servicios, no importando este cliente directamente.
 */
export function getRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  const env = getServerEnv();

  redisClient = new Redis({
    url: env.KV_REST_API_URL,
    token: env.KV_REST_API_TOKEN,
  });

  return redisClient;
}

/**
 * Uso exclusivo en pruebas.
 */
export function resetRedisClientForTests(): void {
  redisClient = null;
}
