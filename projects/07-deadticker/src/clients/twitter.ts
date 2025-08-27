import { TwitterApi, type TweetV2, type UserV2 } from 'twitter-api-v2';
import { getEnv } from '../config/env.js';
import { cacheGet, cacheSet, withPrefix } from './cache.js';

export type Mention = TweetV2 & { author_id: string };

let cachedClient: TwitterApi | null = null;
let cachedUser: UserV2 | null = null;

export function getTwitterClient(): TwitterApi {
	if (cachedClient) return cachedClient;
	const env = getEnv();
	cachedClient = new TwitterApi({
		appKey: env.TWITTER_APP_KEY,
		appSecret: env.TWITTER_APP_SECRET,
		accessToken: env.TWITTER_ACCESS_TOKEN,
		accessSecret: env.TWITTER_ACCESS_SECRET,
	});
	return cachedClient;
}

export async function getBotUser(): Promise<UserV2> {
	if (cachedUser) return cachedUser;
	const client = getTwitterClient();
	const me = await client.v2.me();
	cachedUser = me.data;
	return cachedUser;
}

const SINCE_ID_KEY = withPrefix('mentions:since_id');
const WRITE_RESUME_AT_KEY = withPrefix('twitter:write_resume_at_ms');

export async function getSinceId(): Promise<string | null> {
	return (await cacheGet<string>(SINCE_ID_KEY)) ?? null;
}

export async function setSinceId(id: string): Promise<void> {
	await cacheSet(SINCE_ID_KEY, id);
}

export async function fetchMentions(sinceId?: string | null): Promise<{ mentions: Mention[]; newestId?: string }> {
	const client = getTwitterClient();
	const me = await getBotUser();
	const params = {
		max_results: 50 as const,
		'tweet.fields': 'author_id,referenced_tweets,in_reply_to_user_id,created_at',
		...(sinceId ? { since_id: sinceId } : {}),
	} as const;
	const res = await client.v2.userMentionTimeline(me.id, params as any);
	const mentions = res.tweets as Mention[];
	const newestId = res.meta?.newest_id;
	return { mentions, newestId };
}

export async function uploadPngMedia(buffer: Buffer): Promise<string> {
	const client = getTwitterClient();
	const mediaId = await client.v1.uploadMedia(buffer, { mimeType: 'image/png' });
	return mediaId;
}

export async function replyTo(tweetId: string, text: string, mediaId?: string): Promise<void> {
	const client = getTwitterClient();
	await client.v2.tweet({
		text,
		reply: { in_reply_to_tweet_id: tweetId },
		...(mediaId ? { media: { media_ids: [mediaId] } } : {}),
	});
}

export async function getWriteResumeAtMs(): Promise<number | null> {
	const v = await cacheGet<string>(WRITE_RESUME_AT_KEY);
	if (!v) return null;
	const n = Number(v);
	if (!Number.isFinite(n)) return null;
	return n;
}

export async function setWriteResumeAtMs(resumeAtMs: number): Promise<void> {
	await cacheSet(WRITE_RESUME_AT_KEY, String(resumeAtMs));
}

export async function clearWriteResume(): Promise<void> {
	await cacheSet(WRITE_RESUME_AT_KEY, '');
}

export async function canWriteNow(): Promise<boolean> {
	const resumeAt = await getWriteResumeAtMs();
	if (!resumeAt) return true;
	return Date.now() >= resumeAt;
}
