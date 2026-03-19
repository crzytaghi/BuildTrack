# SQLite + Prisma Migration

The API was migrated from an in-memory store (Maps that wiped on restart) to SQLite via Prisma, giving the app durable storage with zero external dependencies.

## What Changed

| File | Change |
|---|---|
| `prisma/schema.prisma` | Replaced PostgreSQL schema with SQLite (9 models) |
| `prisma/migrations/` | Deleted old PG migration; new `init` migration generated |
| `.env` | `DATABASE_URL` changed to `file:./prisma/dev.db` |
| `src/lib/prisma.ts` | New PrismaClient singleton |
| `src/store.ts` | Types kept; Maps removed; `resetDb`/`seed` now async |
| `src/app.ts` | Uses prisma singleton; auth helpers now async |
| `src/routes/auth.ts` | Uses `prisma.user`/`prisma.session` instead of Maps |
| `src/routes/projects.ts` | All Map calls replaced with Prisma queries |
| `vitest.config.ts` | Added `fileParallelism: false` + test `DATABASE_URL` |
| `package.json` | Added `cross-env`, `prisma:migrate:test` script |
| `tests/*.test.ts` | `beforeEach` made async with `await resetDb(); await seed()` |

## Databases

- **Dev:** `apps/api/prisma/dev.db`
- **Test:** `apps/api/prisma/test.db` (isolated from dev, created by `prisma:migrate:test`)

---

## How to Test and View Changes

### Run the test suite

```bash
cd apps/api
npm test
```

This runs `prisma:migrate:test` first to ensure the test database schema is up to date, then runs all 97 tests with Vitest.

### Start the API server

```bash
cd apps/api
npm run dev
```

API is available at `http://localhost:4000/api/v1`. Quick health check:

```bash
curl http://localhost:4000/api/v1/health
```

### Test persistence manually

```bash
# 1. Sign up and get a token
curl -X POST http://localhost:4000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# 2. List projects (returns 8 seeded projects)
curl http://localhost:4000/api/v1/projects \
  -H "Authorization: Bearer <token>"
```

Stop and restart the server — all data persists across restarts.

### Browse the database visually

```bash
cd apps/api
npx prisma studio
```

Opens a web UI at `http://localhost:5555` where you can browse and edit records in `dev.db` directly.

### Start the full web app

```bash
# From the monorepo root (if a root dev script exists):
npm run dev

# Or start each app separately:
cd apps/api && npm run dev   # API on :4000
cd apps/web && npm run dev   # Web on :5173
```

---

## Adding Future Migrations

When you change `prisma/schema.prisma`, run:

```bash
cd apps/api
npx prisma migrate dev --name <description>
```

This updates `dev.db` and creates a new migration file. The test database picks it up automatically on the next `npm test` run.
