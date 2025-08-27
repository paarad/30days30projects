export function formatPercentChange(pct?: number): number | undefined {
	if (typeof pct !== 'number' || !Number.isFinite(pct)) return undefined;
	// Clamp huge values
	if (pct > 999 || pct < -999) return undefined;
	return pct;
}
