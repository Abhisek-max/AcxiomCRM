import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// The shared project environment file lives at the repository root.
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env') });

const required = ['DATABASE_URL', 'COOKIE_SECRET', 'AUTH_SESSION_SECRET'];
export const env = { port: Number(process.env.PORT ?? 4000), nodeEnv: process.env.NODE_ENV ?? 'development', frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173', databaseUrl: process.env.DATABASE_URL, cookieSecret: process.env.COOKIE_SECRET, authSessionSecret: process.env.AUTH_SESSION_SECRET };
export function validateEnvironment() { const missing = required.filter((key) => !process.env[key]); if (missing.length && env.nodeEnv === 'production') throw new Error(`Missing required environment variables: ${missing.join(', ')}`); }
