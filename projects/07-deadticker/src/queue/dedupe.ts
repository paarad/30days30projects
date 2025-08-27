import { getRedis, withPrefix } from '../clients/cache.js';

export async function isProcessedTweet(tweetId: string): Promise<boolean> {
	const r = getRedis();
	const key = withPrefix(`dedupe:tweet:${tweetId}`);
	const val = await r.get<string>(key);
	return val === '1';
}

export async function markProcessedTweet(tweetId: string): Promise<void> {
	const r = getRedis();
	const key = withPrefix(`dedupe:tweet:${tweetId}`);
	// Keep for 30 days
	await r.set(key, '1', { ex: 30 * 24 * 60 * 60 });
}
