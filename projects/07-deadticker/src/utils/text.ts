import { pickEpitaph } from '../renderer/index.js';

const INSTRUCTION_VARIANTS = [
	'Tag me with a ticker: RIP $WIF @deadticker 🕯️',
	'I engrave when you add $TICKER. Try: RIP $PEPE @deadticker',
	'Add a ticker or contract next time: $WIF or 0x…',
] as const;

export function pickInstruction(seed: string): string {
	const idx = Math.abs(hash(seed)) % INSTRUCTION_VARIANTS.length;
	return INSTRUCTION_VARIANTS[idx] ?? INSTRUCTION_VARIANTS[0];
}

export function composeReply(subject: string, percentChange?: number): string {
	if (typeof percentChange === 'number') {
		const sign = percentChange > 0 ? '+' : '';
		return `${subject} — ${sign}${percentChange.toFixed(1)}% today. Press F.`;
	}
	const epi = pickEpitaph(subject);
	return `${subject} — ${epi.replace(/\.$/, '')}.`;
}

function hash(str: string): number {
	let h = 0;
	for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
	return h;
} 