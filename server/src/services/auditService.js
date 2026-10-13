import { prisma } from '../config/prisma.js';
export const audit = (data) => prisma.auditLog.create({ data }).catch((error) => console.error('Audit write failed', error));
