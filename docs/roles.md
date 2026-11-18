# Roles & Permissions

Every user belongs to one company and has one role. The role is returned on every
`user` object (`/auth/signup`, `/auth/login`, `/auth/me`, invite acceptance).

| Role | Who |
|---|---|
| `owner` | Created at signup. Full access, including team and company settings. A company always has at least one. |
| `manager` | Runs projects and money. Everything except team and company settings. |
| `field` | Crew on site. Only sees projects they are assigned to. |

## Permission matrix

|                                   | Owner | Manager | Field |
|-----------------------------------|:-----:|:-------:|:-----:|
| Team: invite, change role, remove | ✓ | – | – |
| Team: list members                | ✓ | ✓ | – |
| Company settings (edit)           | ✓ | – | – |
| Projects visible                  | all | all | assigned only |
| Create / edit / delete projects   | ✓ | ✓ | – |
| Assign field users to projects    | ✓ | ✓ | – |
| Tasks (create, edit, delete)      | ✓ | ✓ | ✓ |
| Documents                         | ✓ | ✓ | ✓ (assigned projects only, no company-wide docs) |
| Log expenses / attach receipts    | ✓ | ✓ | ✓ |
| Edit / delete expenses            | ✓ | ✓ | – |
| Budget line items & quotes        | ✓ | ✓ | – |
| Invoices                          | ✓ | ✓ | – |
| Vendors & categories              | ✓ | ✓ | view only (no spend totals) |
| Project budget total              | ✓ | ✓ | – (omitted from project responses) |

Enforcement lives in the API (`apps/api/src/lib/permissions.ts`):

- `authorize(roles)` rejects other roles with `403 Forbidden`.
- `projectScope(user)` limits field users' queries to assigned projects. Records on other
  projects return `404 Not Found`, the same as records that don't exist.
- Role changes and removals take effect on the user's next request. Removing a user deletes
  their sessions.

## Endpoints

### Members

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/members` | owner, manager | `{ data: [{ id, name, email, role, createdAt }] }` |
| PATCH | `/members/:id` | owner | `{ role }`. `409` if it would leave the company without an owner. |
| DELETE | `/members/:id` | owner | `409` when removing yourself. |

### Invites

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/invites` | owner | Pending invites only. |
| POST | `/invites` | owner | `{ email, role: "manager" \| "field" }` → `201 { data, token }`. `409` if the email already has an account. Re-inviting an email replaces its earlier link. |
| DELETE | `/invites/:id` | owner | Revoke a pending invite. |
| GET | `/invites/token/:token` | public | `{ data: { email, role, companyName } }`, or `404` if invalid, used or expired. |
| POST | `/invites/token/:token/accept` | public | `{ name, password }` → `201 { token, user, company }`, same shape as signup. |

The raw `token` is returned only once, when the invite is created; the database stores a
SHA-256 hash. Clients turn it into a link such as `https://<web-app>/invite/<token>` for the
owner to share. Links expire after 7 days and work once.

On the web app, owners create links on the **Team** page (`/team`), and invitees open
`/invite/<token>` to set their name and password. Owners and managers assign field users to a
project under **Project → Settings → Crew**.

### Project assignments

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/projects/:id/members` | owner, manager | Field users assigned to the project. |
| POST | `/projects/:id/members` | owner, manager | `{ userId }`. Field users only (`400` otherwise). Idempotent. |
| DELETE | `/projects/:id/members/:userId` | owner, manager | |
