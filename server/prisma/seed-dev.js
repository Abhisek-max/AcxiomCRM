import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
if (process.env.NODE_ENV === "production")
  throw new Error("Development seeding is disabled in production.");
const required = [
  "DEV_ADMIN_EMAIL",
  "DEV_ADMIN_PASSWORD",
  "DEV_MANAGER_EMAIL",
  "DEV_MANAGER_PASSWORD",
  "DEV_SALES_EMAIL",
  "DEV_SALES_PASSWORD",
];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error(`Missing: ${missing.join(", ")}`);
const prisma = new PrismaClient();
const roles = await Promise.all(
  ["Admin", "Manager", "SalesExecutive"].map((name) =>
    prisma.role.upsert({ where: { name }, update: {}, create: { name } }),
  ),
);
const byName = Object.fromEntries(roles.map((r) => [r.name, r]));
const team = await prisma.team.upsert({
  where: { name: "Development Team" },
  update: {},
  create: { name: "Development Team" },
});
for (const [role, email, password] of [
  ["Admin", process.env.DEV_ADMIN_EMAIL, process.env.DEV_ADMIN_PASSWORD],
  ["Manager", process.env.DEV_MANAGER_EMAIL, process.env.DEV_MANAGER_PASSWORD],
  [
    "SalesExecutive",
    process.env.DEV_SALES_EMAIL,
    process.env.DEV_SALES_PASSWORD,
  ],
]) {
  await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { roleId: byName[role].id, teamId: team.id, isActive: true },
    create: {
      email: email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 12),
      firstName: "Development",
      lastName: role,
      roleId: byName[role].id,
      teamId: team.id,
    },
  });
}
const manager = await prisma.user.findUnique({
  where: { email: process.env.DEV_MANAGER_EMAIL.toLowerCase() },
});
await prisma.team.update({
  where: { id: team.id },
  data: { managerId: manager.id },
});
await prisma.$disconnect();
console.log("Development roles and accounts seeded.");
