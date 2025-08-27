export type Subject =
	| { kind: 'ticker'; value: string }
	| { kind: 'contract'; value: string; chainHint?: 'evm' | 'solana' }
	| { kind: 'none' };

const TICKER_RE = /(?<![A-Za-z0-9_])\$([A-Z0-9]{2,10})(?![A-Za-z0-9_])/g;
const EVM_RE = /0x[a-fA-F0-9]{40}/g;
const SOL_RE = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g;

export function extractSubject(text: string): Subject {
	if (!text) return { kind: 'none' };

	const tickerMatch = [...text.toUpperCase().matchAll(TICKER_RE)]
		.map((m) => (m[1] ?? '').trim())
		.filter((v) => v.length > 0);
	if (tickerMatch.length > 0) {
		const first = tickerMatch[0]!;
		return { kind: 'ticker', value: first };
	}

	const evm = [...text.matchAll(EVM_RE)]
		.map((m) => (m[0] ?? '').trim())
		.filter((v) => v.length > 0);
	if (evm.length > 0) {
		const first = evm[0]!;
		return { kind: 'contract', value: first, chainHint: 'evm' };
	}

	const sol = [...text.matchAll(SOL_RE)]
		.map((m) => (m[0] ?? '').trim())
		.filter((v) => v.length > 0);
	if (sol.length > 0) {
		const first = sol[0]!;
		return { kind: 'contract', value: first, chainHint: 'solana' };
	}

	return { kind: 'none' };
}
