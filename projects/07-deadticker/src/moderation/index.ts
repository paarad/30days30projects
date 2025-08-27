const BLOCKLIST = [
	'racial slur 1',
	'racial slur 2',
	'dox',
] as const;

function containsBlocked(text: string): boolean {
	const lower = text.toLowerCase();
	return BLOCKLIST.some((b) => lower.includes(b));
}

export function sanitizeSubject(subject: string): { subject: string; wasFiltered: boolean } {
	if (!subject.trim() || containsBlocked(subject)) {
		return { subject: 'MY BAGS', wasFiltered: true };
	}
	// crude person-name check: two words with capital letters
	if (/^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(subject)) {
		return { subject: 'MY BAGS', wasFiltered: true };
	}
	return { subject, wasFiltered: false };
} 