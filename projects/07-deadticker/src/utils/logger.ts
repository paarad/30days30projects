import pino from 'pino';
import { getEnv } from '../config/env.js';

const env = getEnv();

const baseOptions = {
	level: env.LOG_LEVEL,
	base: { service: 'deadticker' },
} as const;

export const logger = env.NODE_ENV === 'development'
	? pino({ ...baseOptions, transport: { target: 'pino-pretty', options: { colorize: true } } as any })
	: pino(baseOptions as any);
