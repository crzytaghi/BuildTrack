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
- Fix mobile type errors and typecheck mobile in CI. `tsc --noEmit` in `apps/mobile` reports 157 errors:
  - 153 in `__tests__/`: Jest globals (`describe`, `it`, `expect`, `jest`) have no type definitions — add `@types/jest` or Jest types to the mobile tsconfig
  - 3 in `src/navigation/` (AuthStack, DashboardStack, ProjectsStack): navigators missing the now-required `id` prop
  - 1 in `src/navigation/AppTabs.tsx`: cannot resolve types for `@react-navigation/bottom-tabs`
  - Then add mobile to the root `typecheck` script so CI catches regressions
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
