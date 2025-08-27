import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
	NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
	LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

	// Twitter API v2 credentials
	TWITTER_APP_KEY: z.string().min(1, 'TWITTER_APP_KEY is required'),
	TWITTER_APP_SECRET: z.string().min(1, 'TWITTER_APP_SECRET is required'),
	TWITTER_ACCESS_TOKEN: z.string().min(1, 'TWITTER_ACCESS_TOKEN is required'),
	TWITTER_ACCESS_SECRET: z.string().min(1, 'TWITTER_ACCESS_SECRET is required'),

	// Redis/Upstash
	UPSTASH_REDIS_REST_URL: z.string().min(1, 'UPSTASH_REDIS_REST_URL is required'),
	UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'UPSTASH_REDIS_REST_TOKEN is required'),

	// App config
	CACHE_PREFIX: z.string().default('deadticker'),
	GLOBAL_RPS: z.string().default('20'),
	USER_IMAGE_COOLDOWN_MIN: z.string().default('2'),
	USER_INSTRUCTION_COOLDOWN_HOURS: z.string().default('24'),
	REPLY_MIN_INTERVAL_MS: z.string().default('2000'),
});

export type Env = z.infer<typeof EnvSchema> & {
	GLOBAL_RPS_NUM: number;
	USER_IMAGE_COOLDOWN_MS: number;
	USER_INSTRUCTION_COOLDOWN_MS: number;
	REPLY_MIN_INTERVAL_MS_NUM: number;
};

let cachedEnv: Env | null = null;

export function getEnv(): Env {
	if (cachedEnv) return cachedEnv;
	const parsed = EnvSchema.safeParse(process.env);
	if (!parsed.success) {
		const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
		throw new Error(`Invalid environment variables:\n${issues}`);
	}
	const base = parsed.data;
	cachedEnv = {
		...base,
		GLOBAL_RPS_NUM: Number(base.GLOBAL_RPS || '20'),
		USER_IMAGE_COOLDOWN_MS: Number(base.USER_IMAGE_COOLDOWN_MIN) * 60_000,
		USER_INSTRUCTION_COOLDOWN_MS: Number(base.USER_INSTRUCTION_COOLDOWN_HOURS) * 60 * 60_000,
		REPLY_MIN_INTERVAL_MS_NUM: Number(base.REPLY_MIN_INTERVAL_MS || '2000'),
	};
	return cachedEnv;
}
