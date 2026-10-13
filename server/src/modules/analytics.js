import express from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recordScopeWhere } from '../services/accessService.js';

const router = express.Router();
router.use(requireAuth);

const rangeSchema = z.object({ from: z.coerce.date().optional(), to: z.coerce.date().optional() }).refine((value) => !value.from || !value.to || value.from <= value.to, { message: 'The start date must be before the end date.' });
const decimal = (value) => Number(value ?? 0);
const rangeWhere = (field, range) => range.from || range.to ? { [field]: { ...(range.from ? { gte: range.from } : {}), ...(range.to ? { lte: range.to } : {}) } } : {};

async function summary(actor, range) {
  const [customerScope, leadScope, opportunityScope, followUpScope, activityScope] = await Promise.all([
    recordScopeWhere(actor, 'ownerId'), recordScopeWhere(actor, 'assigneeId'), recordScopeWhere(actor, 'assigneeId'), recordScopeWhere(actor, 'assigneeId'), recordScopeWhere(actor, 'userId'),
  ]);
  const leadWhere = { ...leadScope, ...rangeWhere('createdAt', range) };
  const opportunityWhere = { ...opportunityScope, ...rangeWhere('createdAt', range) };
  const [customers, leads, openLeads, opportunities, openOpportunities, won, lost, followUps, leadStatuses, opportunityStages, opportunityRows, wonRows, activityCount] = await Promise.all([
    prisma.customer.count({ where: { ...customerScope, ...rangeWhere('createdAt', range) } }),
    prisma.lead.count({ where: leadWhere }),
    prisma.lead.count({ where: { ...leadWhere, status: { notIn: ['CONVERTED', 'LOST'] } } }),
    prisma.opportunity.count({ where: opportunityWhere }),
    prisma.opportunity.count({ where: { ...opportunityWhere, stage: { notIn: ['WON', 'LOST'] } } }),
    prisma.opportunity.count({ where: { ...opportunityWhere, stage: 'WON' } }),
    prisma.opportunity.count({ where: { ...opportunityWhere, stage: 'LOST' } }),
    prisma.followUp.count({ where: { ...followUpScope, status: 'PLANNED', dueDate: { gte: new Date() } } }),
    prisma.lead.groupBy({ by: ['status'], where: leadWhere, _count: { _all: true } }),
    prisma.opportunity.groupBy({ by: ['stage'], where: opportunityWhere, _count: { _all: true } }),
    prisma.opportunity.findMany({ where: { ...opportunityWhere, stage: { notIn: ['WON', 'LOST'] } }, select: { amount: true, probability: true } }),
    prisma.opportunity.findMany({ where: { ...opportunityWhere, stage: 'WON', expectedCloseDate: { not: null } }, select: { amount: true, expectedCloseDate: true } }),
    prisma.activity.count({ where: { ...activityScope, ...rangeWhere('occurredAt', range) } }),
  ]);
  const pipeline = opportunityRows.reduce((total, item) => total + decimal(item.amount), 0);
  const weightedPipeline = opportunityRows.reduce((total, item) => total + decimal(item.amount) * item.probability / 100, 0);
  const monthTotals = new Map(); for (const item of wonRows) { const label = item.expectedCloseDate.toISOString().slice(0, 7); monthTotals.set(label, (monthTotals.get(label) ?? 0) + decimal(item.amount)); }
  return { metrics: { customers, leads, openLeads, opportunities, openOpportunities, won, lost, upcomingFollowUps: followUps, pipeline, weightedPipeline, activities: activityCount }, charts: { leadStatus: leadStatuses.map((row) => ({ label: row.status, value: row._count._all })), opportunityPipeline: opportunityStages.map((row) => ({ label: row.stage, value: row._count._all })), monthlySales: [...monthTotals.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value })) } };
}

router.get('/dashboard', asyncHandler(async (req, res) => { const range = rangeSchema.parse(req.query); res.json(await summary(req.user, range)); }));
router.get('/reports/summary', asyncHandler(async (req, res) => { const range = rangeSchema.parse(req.query); res.json({ report: await summary(req.user, range) }); }));

export default router;
