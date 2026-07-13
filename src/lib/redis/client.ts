import { Redis } from "@upstash/redis";
import { env } from "@/config/env";

let _redis: Redis | null = null;

/**
 * Returns a singleton Upstash Redis client.
 * Pages and Route Handlers must access Redis through repositories,
 * never by importing this client directly.
 */
export function getRedisClient(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: env.KV_REST_API_URL,
      token: env.KV_REST_API_TOKEN,
    });
  }
  return _redis;
}
