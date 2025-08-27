import { getEnv } from './config/env.js';
import { logger } from './utils/logger.js';
import { getRedis } from './clients/cache.js';
import { fetchMentions, getSinceId, setSinceId, replyTo, uploadPngMedia, canWriteNow, setWriteResumeAtMs } from './clients/twitter.js';
import { extractSubject } from './extractor/index.js';
import { resolveSubject } from './resolver/index.js';
import { renderTombstone } from './renderer/index.js';
import { formatPercentChange } from './market/index.js';
import { tryConsumeGlobal, tryConsumeUserImage } from './queue/rateLimits.js';
import { isProcessedTweet, markProcessedTweet } from './queue/dedupe.js';
import { sanitizeSubject } from './moderation/index.js';
import { composeReply } from './utils/text.js';

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

const env = getEnv();

async function handleMention(tweet: { id: string; text: string; author_id: string }) {
	if (await isProcessedTweet(tweet.id)) return;
	const subjectRaw = extractSubject(tweet.text);
	if (subjectRaw.kind === 'none') {
		// No valid subject → do not reply; just mark as processed
		await markProcessedTweet(tweet.id);
		return;
	}

	const resolved = await resolveSubject(subjectRaw);
	const subjDisplay = `$${resolved.symbol}`;
	const { subject, wasFiltered } = sanitizeSubject(subjDisplay);

	if (!(await tryConsumeGlobal())) return;
	if (!(await tryConsumeUserImage(tweet.author_id))) return;

	// If we're out of daily writes, skip generating/uploading and try later.
	if (!(await canWriteNow())) {
		logger.warn({ tweetId: tweet.id }, 'Write quota exhausted, skipping for now');
		return; // do NOT mark as processed; will retry after resume time
	}

	const percent = formatPercentChange(resolved.priceChange24h);
	const renderOpts = { subject, ...(percent !== undefined ? { percentChange: percent } : {}) } as const;
	const png = await renderTombstone(renderOpts as any);

	let mediaId: string;
	try {
		mediaId = await uploadPngMedia(png);
	} catch (err: any) {
		const code = (err && (err.code || err.status)) ?? 0;
		if (code === 429) {
			const reset = err.rateLimit?.reset ?? err.headers?.['x-app-limit-24hour-reset'];
			if (reset) {
				const resetSec = Number(reset);
				const nowSec = Math.floor(Date.now() / 1000);
				const waitMs = Math.max((resetSec - nowSec) * 1000, 60_000);
				await setWriteResumeAtMs(Date.now() + waitMs);
				logger.warn({ tweetId: tweet.id, waitMs }, 'Hit 429 on media upload; deferring writes');
				return; // do not advance since_id
			}
			logger.warn('429 on media upload; backing off 5 minutes');
			await setWriteResumeAtMs(Date.now() + 5 * 60_000);
			return;
		}
		throw err;
	}

	const text = composeReply(subject, percent);
	try {
		await replyTo(tweet.id, text, mediaId);
	} catch (err: any) {
		const code = (err && (err.code || err.status)) ?? 0;
		if (code === 429) {
			const reset = err.rateLimit?.reset ?? err.headers?.['x-app-limit-24hour-reset'];
			if (reset) {
				const resetSec = Number(reset);
				const nowSec = Math.floor(Date.now() / 1000);
				const waitMs = Math.max((resetSec - nowSec) * 1000, 60_000);
				await setWriteResumeAtMs(Date.now() + waitMs);
				logger.warn({ tweetId: tweet.id, waitMs }, 'Hit 429 on tweet; deferring writes');
				return; // do not mark as processed
			}
			logger.warn('429 on tweet; backing off 5 minutes');
			await setWriteResumeAtMs(Date.now() + 5 * 60_000);
			return;
		}
		throw err;
	}

	await markProcessedTweet(tweet.id);
	logger.info({ tweetId: tweet.id, subject, filtered: wasFiltered }, 'Replied');

	// Inter-reply delay to avoid burst replies
	await sleep(env.REPLY_MIN_INTERVAL_MS_NUM);
}

async function loopOnce() {
	const sinceId = await getSinceId();
	try {
		const { mentions, newestId } = await fetchMentions(sinceId);
		for (const m of mentions.reverse()) {
			try {
				await handleMention({ id: m.id, text: m.text ?? '', author_id: m.author_id });
			} catch (err) {
				logger.error({ err, tweetId: m.id }, 'Failed to handle mention');
			}
			// Space out handling between mentions in the same batch
			await sleep(env.REPLY_MIN_INTERVAL_MS_NUM);
		}
		if (newestId) await setSinceId(newestId);
	} catch (err: any) {
		const code = (err && (err.code || err.status)) ?? 0;
		if (code === 429) {
			logger.warn('Hit Twitter 429; backing off 5 minutes');
			await sleep(5 * 60_000); // 5 minutes
			return;
		}
		logger.error({ err }, 'Error fetching mentions');
		await sleep(10_000); // 10 seconds for other errors
	}
}

async function main() {
	const env = getEnv();
	logger.info({ env: env.NODE_ENV }, 'Deadticker starting');
	await getRedis().ping();
	logger.info('Redis ready');

	// Adaptive poller - poll less frequently when no mentions
	let consecutiveEmptyPolls = 0;
	const baseInterval = 30_000; // 30 seconds
	const maxInterval = 5 * 60_000; // 5 minutes

	while (true) {
		try {
			const sinceId = await getSinceId();
			const { mentions } = await fetchMentions(sinceId);
			
			if (mentions.length === 0) {
				consecutiveEmptyPolls++;
				// Increase polling interval up to 5 minutes when no mentions
				const interval = Math.min(baseInterval * Math.pow(1.5, Math.min(consecutiveEmptyPolls, 4)), maxInterval);
				logger.debug({ interval: interval / 1000, emptyPolls: consecutiveEmptyPolls }, 'No mentions, backing off');
				await sleep(interval);
			} else {
				consecutiveEmptyPolls = 0; // Reset counter when we find mentions
				// Process the mentions we found
				for (const m of mentions.reverse()) {
					try {
						await handleMention({ id: m.id, text: m.text ?? '', author_id: m.author_id });
					} catch (err) {
						logger.error({ err, tweetId: m.id }, 'Failed to handle mention');
					}
					// Space out handling between mentions
					await sleep(env.REPLY_MIN_INTERVAL_MS_NUM);
				}
				// Update since_id with the newest mention
				if (mentions.length > 0) {
					const newestId = mentions[mentions.length - 1]?.id;
					if (newestId) {
						await setSinceId(newestId);
					}
				}
				await sleep(baseInterval);
			}
		} catch (err: any) {
			const code = (err && (err.code || err.status)) ?? 0;
			if (code === 429) {
				// Extract rate limit reset time from headers
				const resetTime = err.rateLimit?.reset;
				if (resetTime) {
					const now = Math.floor(Date.now() / 1000);
					const waitTime = Math.max((resetTime - now) * 1000, 60_000); // At least 1 minute
					logger.warn({ resetTime, waitTime: waitTime / 1000 }, 'Rate limited, waiting for reset');
					await sleep(waitTime);
				} else {
					logger.warn('Rate limited, backing off 5 minutes');
					await sleep(5 * 60_000);
				}
			} else {
				logger.error({ err }, 'Error in main loop');
				await sleep(10_000);
			}
		}
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
