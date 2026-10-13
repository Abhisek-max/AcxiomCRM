import crypto from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
const days = 7;
export const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: env.nodeEnv === 'production', maxAge: days * 86400000, path: '/' };
export async function createSession(userId) { const id = crypto.randomBytes(48).toString('base64url'); const csrfSecret = crypto.randomBytes(32).toString('base64url'); const expiresAt = new Date(Date.now() + days * 86400000); await prisma.session.create({ data: { id, userId, csrfSecret, expiresAt } }); return { id, csrfSecret }; }
export const deleteSession = (id) => prisma.session.delete({ where: { id } }).catch(() => null);
export const deleteUserSessions = (userId) => prisma.session.deleteMany({ where: { userId } });
