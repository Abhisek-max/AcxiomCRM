import { prisma } from '../config/prisma.js';

export async function canAccessUser(actor, targetUserId) {
  if (actor.role.name === 'Admin') return true;
  if (actor.role.name === 'SalesExecutive') return actor.id === targetUserId;
  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { teamId: true } });
  return Boolean(target && actor.teamId && target.teamId === actor.teamId);
}

export async function accessibleUserIds(actor) {
  if (actor.role.name === 'Admin') return null;
  if (actor.role.name === 'SalesExecutive') return [actor.id];
  if (!actor.teamId) return [];
  const users = await prisma.user.findMany({ where: { teamId: actor.teamId }, select: { id: true } });
  return users.map((user) => user.id);
}

export async function recordScopeWhere(actor, ownerField) {
  const ids = await accessibleUserIds(actor);
  return ids === null ? {} : { [ownerField]: { in: ids } };
}

export async function requireRecordAccess(req, res, next, getAssigneeId) {
  const id = Number(req.params.id); if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid record id.' } });
  const record = await getAssigneeId(id); if (!record) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Record not found.' } });
  if (!await canAccessUser(req.user, record.assigneeId ?? record.ownerId ?? record.userId)) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied.' } });
  req.record = record; next();
}
