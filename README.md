# BuildTrack MVP

Monorepo for the BuildTrack MVP (web, mobile, API).

## MVP Scope Notes
- **Budgets and expenses are project-scoped only**.
- Each budget line **must** belong to a single project.
- Each expense **must** belong to a single project.

## Structure
- `apps/api` Fastify + TypeScript API
- `apps/web` React + Vite web app
- `apps/mobile` Expo React Native app

## Quick Start
1. Install deps
```
npm install
```

2. Start API
```
npm run dev:api
```

3. Start Web
```
npm run dev:web
```

4. Start Mobile
```
npm run dev:mobile
```

## API Notes
- The API currently uses an in-memory store for MVP scaffolding.
- Prisma schema is set up in `apps/api/prisma/schema.prisma` for Postgres.
- Auth contract is locked for MVP in `docs/auth.md`.
- When ready, configure `DATABASE_URL` and run migrations:
```
cd apps/api
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
```

## Roadmap Hooks
- Roles and permissions in DB model
- Expense approvals fields in `expenses`
- Subcontractor portal (future app)
- Notifications and real-time updates
