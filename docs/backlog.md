# Backlog

_Last updated: 2026-11-18. Ordered by priority within each section._

## Up Next

### Epic: Multi-User Roles
No role or membership model exists yet — every API route assumes one user per company.
- Story: Invite company members by email, each with their own login
- Story: Roles (e.g. owner, manager, field) stored per user
- Story: Role-based access to projects, enforced on every API route
- Story: Members list and role management in Settings (web + mobile)
- Acceptance: A user can only see and edit projects their role allows
- Acceptance: API tests cover permission checks for each role

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
- Remove unused code: `apps/web/src/components/BudgetView.tsx`, `apps/mobile/src/screens/TasksScreen.tsx`, `apps/mobile/src/screens/PlaceholderScreen.tsx` (none are referenced)
- Mobile `jest-expo` (^55) is a major version ahead of `expo` (^54); align them

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
