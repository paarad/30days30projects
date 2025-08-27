import { cacheGet, cacheSet, withPrefix } from '../clients/cache.js';
import { type Subject } from '../extractor/index.js';
import { request } from 'undici';

export type ResolvedToken = {
	symbol: string;
	name?: string;
	chain?: string;
	priceChange24h?: number;
	source: 'dexscreener' | 'passthrough' | 'unknown';
};

export async function resolveSubject(subject: Subject): Promise<ResolvedToken> {
	if (subject.kind === 'ticker') {
		return { symbol: subject.value, source: 'passthrough' };
	}
	if (subject.kind === 'contract') {
		const cacheKey = withPrefix(`contract:${subject.value}`);
		const cached = await cacheGet<ResolvedToken>(cacheKey);
		if (cached) return cached;
		const fromDex = await resolveViaDexscreener(subject.value);
		const result = fromDex ?? { symbol: 'UNKNOWN TOKEN', source: 'unknown' as const };
		await cacheSet(cacheKey, result, { ttlSeconds: 24 * 60 * 60 });
		return result;
	}
	return { symbol: 'UNKNOWN TOKEN', source: 'unknown' };
}

async function resolveViaDexscreener(address: string): Promise<ResolvedToken | null> {
	try {
		const url = `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(address)}`;
		const { body, statusCode } = await request(url, { method: 'GET', headers: { accept: 'application/json' } });
		if (statusCode !== 200) return null;
		const json = (await body.json()) as any;
		const pairs: any[] = Array.isArray(json?.pairs) ? json.pairs : [];
		if (pairs.length === 0) return null;
		pairs.sort((a, b) => (Number(b?.liquidity?.usd ?? 0) - Number(a?.liquidity?.usd ?? 0)));
		const top = pairs[0];
		const base = top?.baseToken ?? {};
		const symbol = String(base?.symbol ?? '').toUpperCase() || 'UNKNOWN TOKEN';
		const name = String(base?.name ?? '').trim();
		const chain = String(top?.chainId ?? top?.chain ?? '').trim();
		const priceChange24h = typeof top?.priceChange?.h24 === 'number' ? top.priceChange.h24 : undefined;
		const token: ResolvedToken = {
			symbol,
			source: 'dexscreener',
			...(name ? { name } : {}),
			...(chain ? { chain } : {}),
			...(priceChange24h !== undefined ? { priceChange24h } : {}),
		};
		return token;
	} catch {
		return null;
	}
}
