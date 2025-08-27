import { Canvas, loadImage, FontLibrary } from 'skia-canvas';
import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 1024;

const EPITAPHS = [
	'Gone but not forgotten.',
	"Another rug in the chain's long graveyard.",
	'We hardly knew ye.',
	'Press F to pay respects.',
	'Pumped. Dumped. Remembered.',
	'May your candles burn bright.',
] as const;

const TEMPLATE_DIR = path.resolve('assets/templates');
let cachedTemplates: string[] | null = null;

// Load Cinzel font if available
try {
	FontLibrary.use('Cinzel', path.resolve('assets/fonts/Cinzel-Regular.ttf'));
	FontLibrary.use('Cinzel-Bold', path.resolve('assets/fonts/Cinzel-Bold.ttf'));
} catch {
	// Fallback to system fonts if Cinzel not found
}

export async function listTemplatePaths(): Promise<string[]> {
	if (cachedTemplates) return cachedTemplates;
	try {
		const files = await fs.readdir(TEMPLATE_DIR);
		cachedTemplates = files
			.filter((f) => /\.(png|jpg|jpeg)$/i.test(f))
			.sort()
			.map((f) => path.join(TEMPLATE_DIR, f));
		return cachedTemplates;
	} catch {
		cachedTemplates = [];
		return cachedTemplates;
	}
}

export async function pickTemplatePathForSubject(subject: string): Promise<string | undefined> {
	const templates = await listTemplatePaths();
	if (templates.length === 0) return undefined;
	const idx = Math.abs(hashString(subject)) % templates.length;
	return templates[idx];
}

export function pickEpitaph(seedText: string): string {
	const idx = Math.abs(hashString(seedText)) % EPITAPHS.length;
	return EPITAPHS[idx] ?? EPITAPHS[0];
}

function hashString(str: string): number {
	let h = 2166136261;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
	}
	return h | 0;
}

function clampSubject(subject: string): string {
	const s = subject.toUpperCase();
	if (s.length <= 18) return s;
	return s.slice(0, 17) + '…';
}

export type RenderOptions = {
	subject: string; // like $WIF
	epitaph?: string;
	percentChange?: number; // optional footer
	templatePath?: string; // optional base PNG
};

export async function renderTombstone(opts: RenderOptions): Promise<Buffer> {
	let width = DEFAULT_WIDTH;
	let height = DEFAULT_HEIGHT;
	let templateImg: any | undefined;

	if (opts.templatePath) {
		try {
			await fs.access(opts.templatePath);
			templateImg = await loadImage(opts.templatePath);
			if (templateImg && templateImg.width && templateImg.height) {
				width = templateImg.width;
				height = templateImg.height;
			}
		} catch {
			// ignore
		}
	}

	const canvas = new Canvas(width, height);
	const ctx = canvas.getContext('2d');

	if (templateImg) {
		ctx.drawImage(templateImg, 0, 0, width, height);
	} else {
		drawGradientBackground(ctx, width, height);
	}

	// Subtle vignette overlay for better focus
	drawVignette(ctx, width, height);

	// Engraving text
	const subject = clampSubject(opts.subject);
	const epitaph = opts.epitaph ?? pickEpitaph(subject);

	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	// Scaled font sizes
	const px = (p: number) => Math.max(12, Math.round((p / 1024) * height));

	// HERE LIES
	ctx.font = `${px(32)}px serif`;
	ctx.fillStyle = '#2c2c2e';
	ctx.fillText('HERE LIES', width / 2, Math.round(height * 0.26));

	// Subject with fixed 700px max width constraint
	const subjectCenterY = Math.round(height * 0.39);
	const maxWidth = 700; // Fixed constraint
	const maxFontPx = px(120);
	const minFontPx = px(24);
	const subjectFontPx = calculateFitFontSize(ctx, subject, maxWidth, maxFontPx, minFontPx);
	drawEngraved(ctx, subject, width / 2, subjectCenterY, subjectFontPx);

	// Epitaph below subject
	ctx.font = `${px(36)}px serif`;
	ctx.fillStyle = '#2e2e30';
	const epitaphY = Math.round(height * 0.5);
	ctx.fillText(epitaph, width / 2, epitaphY);

	// Optional footer stat
	if (typeof opts.percentChange === 'number') {
		const sign = opts.percentChange > 0 ? '+' : '';
		ctx.font = `${px(28)}px serif`;
		ctx.fillStyle = opts.percentChange >= 0 ? '#1fbf6a' : '#e05353';
		ctx.fillText(`${sign}${opts.percentChange.toFixed(1)}% today`, width / 2, Math.round(height * 0.86));
	}

	const buf = await canvas.toBuffer('png');
	return Buffer.from(buf);
}

function calculateFitFontSize(ctx: any, text: string, maxWidth: number, maxFontPx: number, minFontPx: number): number {
	for (let fontPx = maxFontPx; fontPx >= minFontPx; fontPx -= 2) {
		ctx.font = `bold ${fontPx}px Cinzel, serif`;
		const w = ctx.measureText(text).width;
		if (w <= maxWidth) {
			return fontPx;
		}
	}
	return minFontPx;
}

function drawEngraved(ctx: any, text: string, x: number, y: number, fontPx: number) {
	ctx.save();
	ctx.font = `bold ${fontPx}px Cinzel, serif`;
	ctx.fillStyle = '#2a2a2c';
	ctx.fillText(text, x + 4, y + 4);
	ctx.fillStyle = '#d0d0d2';
	ctx.fillText(text, x, y);
	ctx.restore();
}

function drawGradientBackground(ctx: any, width: number, height: number) {
	const grad = ctx.createLinearGradient(0, 0, 0, height);
	grad.addColorStop(0, '#1b1b1b');
	grad.addColorStop(1, '#0e0e0e');
	ctx.fillStyle = grad as any;
	ctx.fillRect(0, 0, width, height);
}

function drawVignette(ctx: any, width: number, height: number) {
	const vignette = ctx.createRadialGradient(width / 2, height / 2, width / 3, width / 2, height / 2, Math.max(width, height) / 1.1);
	vignette.addColorStop(0, 'rgba(0,0,0,0)');
	vignette.addColorStop(1, 'rgba(0,0,0,0.65)');
	ctx.fillStyle = vignette as any;
	ctx.fillRect(0, 0, width, height);
}
