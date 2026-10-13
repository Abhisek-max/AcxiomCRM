# AcxiomCRM

> **Current implementation note:** this README contains historical phase notes below. Authentication, role enforcement, CRM APIs, and the CRM UI are now implemented; references to them as future work are obsolete. The client uses hash navigation: `#dashboard`, `#customers`, `#leads`, `#opportunities`, `#follow-ups`, `#activities`, and (for Admin users only) `#admin`. The dashboard metrics are still static placeholders.

Signing out opens an accessible confirmation dialog. Cancellation leaves the active session unchanged; confirmation uses the existing authenticated, CSRF-protected logout request.

## Current setup and verification

Copy `.env.example` to `.env`, set the MySQL connection and secrets, install dependencies, then run the server and client in separate terminals:

```powershell
npm run install:all
npm run dev:server
npm run dev:client
```

Before first use of an empty development database, run `npm run prisma:generate --prefix server`, then explicitly apply a migration and optionally seed development users. Do not run migrations or seed scripts against production data.

```powershell
npm run prisma:validate --prefix server
npm run check --prefix server
npm run build --prefix client
cd server
node --check src/modules/crm.js
node --check src/modules/admin.js
```

No automated tests or dedicated test database are configured. The frontend is React + Vite + Tailwind; the backend is Express + Prisma + MySQL. This differs from the early roadmap wording that presented many completed features as planned.

## API and production notes

The current API exposes authentication at `/api/auth`, CRM resources at `/api/customers`, `/api/leads`, `/api/opportunities`, `/api/follow-ups`, and `/api/activities`, role-scoped dashboard/report summaries at `/api/dashboard` and `/api/reports/summary`, and Admin user/audit access at `/api/admin/users` and `/api/admin/audit-logs`. CRM and admin write routes require the server-issued CSRF token. Development role accounts are configured only through the `DEV_ADMIN_*`, `DEV_MANAGER_*`, and `DEV_SALES_*` environment variables and can be created with `npm run seed:dev --prefix server`; never place their real values in this document.

Use HTTPS in production so Secure session cookies are sent only over encrypted connections. Set distinct, strong production secrets through the environment, use a least-privileged database user, and do not commit either root `.env` or `server/.env`.

AcxiomCRM is a production-oriented CRM foundation for managing customers, leads, opportunities, follow-ups, activities, reporting, and accountable sales work. This first implementation establishes the responsive React application, secure backend baseline, and MySQL/Prisma data model; business modules and authentication are intentionally scheduled for later prompts.

## Stack

| Technology | Purpose |
| --- | --- |
| React + Vite | Fast, component-based frontend development |
| Tailwind CSS v4 | Responsive, accessible UI styling via Vite integration |
| Node.js + Express | REST API foundation |
| MySQL 8.0 | Relational production database |
| Prisma | Typed database client, schema, and migrations |
| Chart.js + react-chartjs-2 | Future role-authorized dashboard charts |
| Zod | Future request validation |
| Helmet, CORS, Morgan | HTTP security headers, trusted-origin requests, development logging |

## Status and roadmap

Implemented now: Vite/React/Tailwind shell, responsive sidebar-ready layout, dashboard placeholder, Express JSON API with security headers/CORS/error handling, health check, environment configuration, Prisma singleton, and the initial CRM schema.

Planned modules: secure login/logout/session renewal; password hashing, policy, failed-login lockout and CSRF defenses; Admin/Manager/SalesExecutive authorization and record-level access; customer, lead, opportunity, follow-up, activity and audit APIs; validation/business rules; searchable/paginated lists; dashboards/KPIs/charts; tests and reporting/export.

## Architecture

```
client/src/
  components/ layouts/ pages/ services/ hooks/ utils/ assets/
server/src/
  config/ middleware/ modules/ services/ validators/ utils/
server/prisma/schema.prisma
```

The client owns presentation and usability validation. The server will own authentication, authorization, server-side validation, business rules, DTOs, audit logging, and database access. Prisma is the sole intended database access layer.

## Database model

`Role` has the supported values `Admin`, `Manager`, and `SalesExecutive`; users belong to one role. Users own customers and can be assigned leads, opportunities, and follow-ups. A lead can be converted to at most one customer through `Customer.sourceLeadId`, and opportunities may reference both their originating lead and resulting customer. Follow-ups and activities may belong to a customer, lead, or opportunity. Audit logs are append-oriented and record actor, action, entity, record identifier, before/after JSON, IP, and timestamp.

Customer codes, emails, and phones are unique (email/phone permit multiple `NULL` values in MySQL). Lead and opportunity codes are unique. Passwords are never stored in plaintext; `passwordHash` is reserved for a strong hashing implementation in the authentication phase.

## Prerequisites

- Node.js (current LTS recommended)
- npm
- MySQL Server 8.0
- Git

## Install and run

From the repository root:

```bash
npm run install:all
Copy-Item .env.example .env
```

Configure `.env`, then start each application in its own terminal:

```bash
npm run dev:client
npm run dev:server
```

Frontend: `http://localhost:5173`
API health: `http://localhost:4000/api/health`

For production-like checks:

```bash
npm run build --prefix client
npm run check --prefix server
```

## MySQL and Prisma

Create a database and a least-privileged application user in MySQL, then set a URL like the placeholder in `.env.example`:

```sql
CREATE DATABASE acxiomcrm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Run these after dependencies are installed and `DATABASE_URL` points to the database:

```bash
npm run prisma:validate --prefix server
npm run prisma:generate --prefix server
npm run prisma:migrate --prefix server -- --name init
```

`prisma validate` and client generation do not require a reachable database, while `prisma migrate dev` does. No migration is included because this environment has not been given MySQL credentials.

## Environment variables

Copy `.env.example` to `.env`. `PORT`, `FRONTEND_ORIGIN`, `DATABASE_URL`, `COOKIE_SECRET`, and `AUTH_SESSION_SECRET` are provided. The secret values must be distinct, long random values before any deployed use. `.env` is ignored by Git.

## Authentication and authorization design

The API has no placeholder login and no route is presented as protected yet. The next phase will add server-managed, HTTP-only secure cookies, CSRF protection, a strong password hash, lockout tracking, and server-enforced role and ownership checks. Sensitive fields—including password hashes—will never be returned in response DTOs.

## Planned API and quality rules

REST modules will use explicit status codes, Zod validation, Prisma parameterization, audit events for security/CRUD/role changes, and page/filter/sort/search contracts. Active opportunities require a positive amount, probability is 0–100, active close dates cannot be past, and planned follow-ups cannot be created in the past. Database constraints plus server validation will prevent customer duplicates.

## Acceptance checklist

- [x] Responsive UI base with keyboard focus styles and mobile navigation
- [x] Security headers, JSON size limit, explicit CORS origin with credentials
- [x] Centralized API error and 404 responses
- [x] MySQL Prisma schema with relationships, indexes, and audit records
- [ ] Authentication, cookies, CSRF, hashing, lockout, role enforcement
- [ ] CRM CRUD APIs/UI, reporting/charts, tests, pagination and filtering

## Git and security

```bash
git init
git add .
git commit -m "chore: establish AcxiomCRM foundation"
git branch -M main
git remote add origin <YOUR_GITHUB_REPOSITORY_URL>
git push -u origin main
```

Never commit `.env`, real database URLs, cookies/session secrets, or production credentials. Use separate least-privileged database users and rotate exposed secrets immediately.

## Next prompt

Implement authentication: password security and policy, failed-login tracking/lockout, role seeding and authorization middleware, secure HTTP-only cookie sessions, CSRF protection, safe user DTOs, and corresponding validation/tests.

## Phase 2 authentication

Authentication uses bcrypt cost 12, generic login errors, five-attempt/15-minute account lockout, rate limiting, opaque MySQL-backed sessions in HTTP-only `SameSite=Lax` cookies (Secure in production), and server-verified CSRF tokens for authenticated writes. `GET /api/auth/me` restores sessions. API DTOs never include hashes, session IDs, CSRF secrets, or lockout fields.

Admins can list users and change other users' roles through `/api/admin`; all admin routes require an authenticated Admin and CSRF protection. Public registration always creates SalesExecutives. Teams provide the durable manager-scope foundation; future CRM record endpoints must enforce team/assignment scope server-side.

To seed development accounts only, set `DEV_ADMIN_EMAIL`, `DEV_ADMIN_PASSWORD`, `DEV_MANAGER_EMAIL`, `DEV_MANAGER_PASSWORD`, `DEV_SALES_EMAIL`, and `DEV_SALES_PASSWORD` in `.env`, then run `npm run seed:dev --prefix server`. The script refuses `NODE_ENV=production` and creates all roles plus a Development Team. Never use production credentials.

## Phase 3 CRM APIs

Authenticated, CSRF-protected REST endpoints are available at `/api/customers`, `/api/leads`, `/api/opportunities`, `/api/follow-ups`, and `/api/activities`. They provide create, list, read, update, and delete operations; list routes accept `page`, `pageSize`, and `search`. Leads can be converted transactionally through `POST /api/leads/:id/convert`; follow-ups support `POST /api/follow-ups/:id/complete`, `cancel`, and `miss`.

All module operations are audited. Admins can access all records; Managers are limited to users in their Team; SalesExecutives are limited to their assigned or owned records. Opportunity amount/probability/close-date and follow-up scheduling validation are server-enforced. Run the migrations with `npm run prisma:migrate --prefix server -- --name <name>` only for future additive schema updates.
