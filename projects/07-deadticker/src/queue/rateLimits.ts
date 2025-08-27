import { getEnv } from '../config/env.js';
import { getRedis, withPrefix } from '../clients/cache.js';

function minuteKey(): string {
	const now = Math.floor(Date.now() / 60000);
	return withPrefix(`rl:global:${now}`);
}

export async function tryConsumeGlobal(): Promise<boolean> {
	const env = getEnv();
	const r = getRedis();
	const key = minuteKey();
	const val = await r.incr(key);
	if (val === 1) {
		await r.expire(key, 70);
	}
	return val <= env.GLOBAL_RPS_NUM;
}

export async function tryConsumeUserImage(userId: string): Promise<boolean> {
	const env = getEnv();
	const r = getRedis();
	const key = withPrefix(`rl:user:${userId}:image`);
	const ok = await r.set(key, '1', { nx: true, px: env.USER_IMAGE_COOLDOWN_MS });
	return ok === 'OK';
}

export async function canSendInstruction(userId: string): Promise<boolean> {
	const env = getEnv();
	const r = getRedis();
	const key = withPrefix(`rl:user:${userId}:instruction`);
	const ok = await r.set(key, '1', { nx: true, px: env.USER_INSTRUCTION_COOLDOWN_MS });
	return ok === 'OK';
}
