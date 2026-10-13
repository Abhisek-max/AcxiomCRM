# Final compliance audit — AcxiomCRM

Audit date: 2026-10-13. Scope: existing React/Vite/Tailwind client and Express/Prisma/MySQL server. No database migrations, seed operations, account mutations, lockout attempts, or destructive tests were run.

## Verification update — sign-out confirmation

On 2026-10-13, `client/src/layouts/AppLayout.jsx` was changed to require a confirmation before calling the existing `onLogout` callback from `client/src/App.jsx`. The dialog uses `role="dialog"`, accessible labels, initial Cancel focus, Escape/backdrop cancellation when idle, responsive layout, duplicate-request prevention, a loading label, and an API-failure alert. `client/src/components/Button.jsx` now forwards refs to support that focus behavior.

Static evidence confirms the modal does not invoke logout on Cancel and invokes the existing CSRF-protected `POST /api/auth/logout` path only on confirmation. Browser/API session lifecycle testing remains **NOT VERIFIED** because no browser automation surface, test suite, or isolated test database is available.

## A. Executive summary

**Overall status: PASS WITH GAPS — the core security baseline, role-scoped APIs, dashboard, summary report endpoint, and audit-log read API are implemented and key requests were verified.** Comprehensive CRM UI workflows, automated tests, dedicated test infrastructure, and several reporting views remain incomplete, so it is not fully case-study compliant.

Two verified security defects were fixed in this audit:

1. CRM writes could relate a record to a customer, lead, or opportunity outside the actor's permitted scope. `server/src/modules/crm.js` now verifies related-record existence and scope for create/update.
2. An Admin could deactivate or demote the final active Admin. `server/src/modules/admin.js` now rejects that with `409 LAST_ADMIN_PROTECTED`.
3. Follow-up and activity search queried a nonexistent `name` field. `server/src/modules/crm.js` now searches notes and subject, and applies record scope before pagination.
4. `DashboardPage.jsx` used hardcoded metrics. `server/src/modules/analytics.js` now calculates scoped data; the client renders live KPIs and charts.

## B. Requirement matrix

| Area | Status | Evidence / risk / action |
| --- | --- | --- |
| Architecture separation | PARTIAL | Client presentation is in `client/src`; Express modules, middleware, Prisma and services are separated. CRM module remains compact and mixes route/business orchestration. |
| Registration/login/logout/session | PARTIAL | `server/src/modules/auth.js`, `sessionService.js`; source reviewed, not end-to-end tested. |
| Password hashing/policy/lockout/rate limiting | PARTIAL | bcrypt cost 12, 8-character minimum, five failures/15-minute lockout, auth rate limiter. Complexity requirements beyond length are absent; lockout behavior NOT VERIFIED. |
| Cookies/CSRF/session invalidation | PARTIAL | HTTP-only, SameSite=Lax, Secure in production; server-held sessions and CSRF header. Browser/API lifecycle NOT VERIFIED. |
| Protected APIs and error safety | PARTIAL | `requireAuth`, `allowRoles`, Zod, Prisma. Anonymous/forbidden response cases NOT VERIFIED against a running database. |
| Admin user management | PARTIAL | Admin-only list, role/status/team endpoints and basic UI. No create/edit/search/password reset/lockout-admin UI. Last-admin protection fixed. |
| CRM CRUD APIs | PARTIAL | Customer, lead, opportunity, follow-up and activity endpoints in `crm.js`; scoped pagination and valid search fields are implemented. No record-mutation integration tests. |
| Customer requirements | FAIL | API/UI lack required email/phone enforcement, city/state/notes, UI details/edit/delete/filter/sort/history, and tested duplicates. |
| Lead conversion/workflow | PARTIAL | Transactional convert endpoint exists with duplicate conversion guard. UI conversion, priority/company search, state-transition rules and testing are absent. |
| Opportunities | PARTIAL | Amount/probability/past-close-date validation exists. UI and API lack full details/sorting/stage workflow/reporting; relation error cases untested. |
| Follow-ups/activities | PARTIAL | Follow-up transition endpoints and activity CRUD exist. UI lacks edit/delete/reschedule/action controls, subject/status/date views and tested scope cases. |
| Audit log | PARTIAL | Append-only write service, Admin-only paginated `/api/admin/audit-logs` with filters, and event calls exist. There is no audit-log UI; audit write failure is still logged and swallowed. |
| Dashboard/charts/reports | PARTIAL | `/api/dashboard` and `/api/reports/summary` calculate role-scoped KPIs, lead/pipeline/monthly-sales charts and date filters. No individual report pages, export, or report navigation. |
| UI/accessibility/browser workflow | PARTIAL | Hash navigation, labels and loading/error/empty states exist. Browser automation unavailable; responsive/keyboard/error-flow testing NOT VERIFIED. |
| Tests | FAIL | No unit, integration, E2E or dedicated test DB is configured. |
| Git/secrets | PARTIAL | `.gitignore` excludes root `.env` and `server/.env`; local Git was initialized during prior work, but Git's sandbox ownership protection prevented status/history inspection. |

## C. Role permission matrix

| Operation | Admin | Manager | SalesExecutive | Evidence / status |
| --- | --- | --- | --- | --- |
| CRM record scope | Intended all | Intended same team | Intended self/assigned | `accessService.js`; NOT VERIFIED with independent sessions. |
| Admin users | Allowed | Denied | Denied | `admin.js` + `allowRoles('Admin')`; direct-request test NOT VERIFIED. |
| Role/status change | Allowed except self/last Admin | Denied | Denied | `admin.js`; static verification only. |
| Dashboard/reports | Scoped dashboard/summary | Scoped dashboard/summary | Scoped dashboard/summary | Dashboard 200 verified for all three configured roles. |
| Audit logs | Admin-only API | Denied by middleware | Denied by middleware | Source reviewed; non-Admin audit endpoint test NOT VERIFIED. |

## D. Validation matrix

| Input | Expected behavior | Source evidence | Result |
| --- | --- | --- | --- |
| Invalid email | 400 | Zod customer/lead/auth schemas | NOT VERIFIED at runtime |
| Invalid phone | 400 | Customer has min/max length; lead max only | PARTIAL: format is not enforced |
| Missing customer/lead name | 400 | Zod `.min(1)` | NOT VERIFIED at runtime |
| Duplicate customer email/phone | conflict | Prisma unique columns | NOT VERIFIED; error mapping is not explicitly 409 |
| Opportunity amount <= 0 / probability 101 | 400 | `oppSchema` | NOT VERIFIED at runtime |
| Past close/follow-up | 400 | `oppSchema` / `followSchema` | NOT VERIFIED at runtime |
| Invalid assignment/related record | 403/404 | `crm.js` access helpers | Fixed; NOT VERIFIED at runtime |
| Last Admin removal | 409 | `admin.js` `assertNotLastActiveAdmin` | Fixed; NOT VERIFIED at runtime |

## E. API matrix

| Endpoint family | Auth/scope | Status |
| --- | --- | --- |
| `/api/auth/register`, `/login`, `/me`, `/logout`, `/csrf` | public/session/CSRF as applicable | Login/logout/session invalidation verified for all three configured roles |
| `/api/customers`, `/leads`, `/opportunities`, `/follow-ups`, `/activities` | authenticated, CSRF writes, record/team scope | Anonymous 401, missing CSRF 403 and invalid pagination 400 verified; mutation/scope matrix remains untested |
| `/api/admin/users`, `/api/admin/audit-logs` | Admin + CSRF writes | Admin user list 200; Manager/SalesExecutive list 403 verified; audit list source reviewed |
| `/api/dashboard`, `/api/reports/summary` | authenticated, role-scoped | Dashboard 200 verified for all roles; summary source reviewed |

## F. UI/workflow matrix

| UI | Result |
| --- | --- |
| Login/register/dashboard/logout | Rendered routes exist. Logout confirmation modal source reviewed and production build verified; interactive session verification NOT VERIFIED. |
| CRM list/create/search | Implemented with API total-driven pagination in `CrmPage.jsx`; details/edit/delete/sort and workflow actions remain absent. |
| Admin user management | List, role and status controls implemented; no confirmation for deactivation. |
| Dashboard | Live role-scoped KPIs, date filters and three Chart.js visualizations implemented; browser rendering NOT VERIFIED. |

## G. Test results

Passed on 2026-10-13:

```text
npm run prisma:validate --prefix server
npm run check --prefix server
npm run build --prefix client
cd server; node --check src/modules/crm.js; node --check src/modules/admin.js
```

The current client build transformed 28 modules successfully. No automated test command exists. Focused API checks verified: anonymous dashboard/customer requests return 401; Admin, Manager, and SalesExecutive login and dashboard access return 200; Admin user list returns 200 while Manager/SalesExecutive return 403; Admin audit-log and report-summary requests return 200 while the Manager audit-log request returns 403; logout returns 204 and a reused session returns 401; missing CSRF returns 403; invalid pagination returns 400. Browser automation was unavailable.

## H. Security findings

| Severity | Finding | Disposition |
| --- | --- | --- |
| High | Cross-scope related-record association | Fixed in `crm.js`; add integration regression tests. |
| High | Last active Admin could be removed/demoted | Fixed in `admin.js`; add concurrency-safe transactional test. |
| Resolved | Customer email/phone requiredness, phone format, and duplicate conflict response | Server validation and `409 DUPLICATE_RECORD` mapping added; mutation test remains unperformed. |
| Medium | Audit-log UI and individual/exportable report views are absent | Remaining. |
| Resolved | `server/.env` was not ignored by the root `.gitignore` | Fixed by adding `server/.env`; Git history/tracked-file inspection remains blocked by sandbox ownership. |
| Low | Console error logging may include ORM internals in server logs | Remaining; adopt structured/redacted logging. |

## I. Remaining gaps and next actions

1. Add a test database, API integration tests with cross-user records, and browser E2E coverage.
2. Implement CRM details/edit/delete/history, conversion/follow-up UI actions, and destructive-action confirmation.
3. Add individual report views/exports and an Admin audit-log UI.
4. Add user search/create/edit and a secure password-reset flow.
5. Inspect Git status/history from the repository owner account before committing.

## J. Submission readiness

**Not ready for full compliance submission.** It can be evaluated as a functional CRM/security baseline only if the above mandatory gaps and unverified cases are disclosed.
