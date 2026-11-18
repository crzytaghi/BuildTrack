# Backlog

_Last updated: 2026-11-18. Ordered by priority within each section._

## Up Next

### Epic: Multi-User Roles
Roles: Owner / Manager / Field. Invites are one-time links (no email service yet). See `docs/roles.md`.
- ~~Story: API — roles, invite links, project assignments, permission checks on every route, tests~~ (done)
- Story: Web — Team page (invite, pending invites, roles, remove), invite acceptance page, project assignment, hide UI by role
- Story: Mobile — invite acceptance, hide screens/actions by role, field users see assigned projects only
- Later: send invite links by email once an email service is added

### Epic: Security Fixes
- ~~Story: Demo data was seeded on every API start, including production~~ (done: opt-in via `SEED_DEMO_DATA=true`, never in production)
- Story: When production is back up, check whether it has the demo account (`seed@buildtrack.dev`) and delete company `company_seed` if so
- Story: Expense create/update doesn't check that `categoryId`, `vendorId` and `lineItemId` belong to the user's company

### Epic: Mobile Parity
Features on web that mobile is missing.
- Story: Reports screen
- Story: Invoices tab in project detail
- Story: Project Settings tab in project detail
- Story: Company-wide Documents screen

### Epic: Test Coverage
- Story: API tests for projects, tasks, documents, invoices, and quotes routes
- Story: Web component tests beyond auth and dashboard (projects, expenses, reports)

## Housekeeping
- Optional: bump `expo` 54.0.33 → ~54.0.37 (patch update suggested by `npx expo install --check`)

## Later
- Subcontractor portal (bids, schedule updates)
- Expense approvals + notifications
- Accounting integrations
- Multi-company support

## Done
- Auth: signup/login/logout, password change, signup collects company info
- Company setup on first login (server-side)
- Projects: create, update, detail view
- Tasks with overdue indicators
- Expenses with receipt attachments
- Document notes editing
- Dashboard charts (monthly spend, spend by category)
- Web + API test infrastructure and GitHub Actions CI
- Mobile tests in CI
- Removed unused web `BudgetView` and mobile `TasksScreen` / `PlaceholderScreen`
- Aligned `jest-expo` with Expo 54
- Mobile typechecks cleanly (strict mode, Jest types) and runs in CI typecheck
