import { Redis } from '@upstash/redis';
import { getEnv } from '../config/env.js';

export type CacheSetOptions = { ttlSeconds?: number };

let redis: Redis | null = null;

export function getRedis(): Redis {
	if (redis) return redis;
	const env = getEnv();
	redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN });
	return redis;
}

export function withPrefix(key: string): string {
	const env = getEnv();
	return `${env.CACHE_PREFIX}:${key}`;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
	const r = getRedis();
	return (await r.get<T>(withPrefix(key))) ?? null;
}

export async function cacheSet<T>(key: string, value: T, opts?: CacheSetOptions): Promise<void> {
	const r = getRedis();
	const full = withPrefix(key);
	if (opts?.ttlSeconds && opts.ttlSeconds > 0) {
		await r.set(full, value, { ex: opts.ttlSeconds });
	} else {
		await r.set(full, value);
	}
}

export async function cacheDel(key: string): Promise<void> {
	const r = getRedis();
	await r.del(withPrefix(key));
}
