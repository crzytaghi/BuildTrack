# Auth API Contract (Locked for MVP)

This document defines the stable contract for auth endpoints. The backend may change
implementation (in-memory -> Postgres), but request/response shapes and status codes
should remain unchanged.

## Base URL

`/auth`

## POST /auth/signup

Create a new user and return a session token.

**Request**

```json
{
  "name": "Alex Builder",
  "email": "alex@buildtrack.com",
  "password": "securepass1"
}
```

**Responses**

- `201 Created`

```json
{
  "token": "<session-token>",
  "user": {
    "id": "user_123",
    "name": "Alex Builder",
    "email": "alex@buildtrack.com"
  }
}
```

- `409 Conflict` (email already in use)

```json
{
  "error": "Email already in use"
}
```

## POST /auth/login

Authenticate an existing user and return a session token.

**Request**

```json
{
  "email": "alex@buildtrack.com",
  "password": "securepass1"
}
```

**Responses**

- `200 OK`

```json
{
  "token": "<session-token>",
  "user": {
    "id": "user_123",
    "name": "Alex Builder",
    "email": "alex@buildtrack.com"
  }
}
```

- `401 Unauthorized`

```json
{
  "error": "Invalid credentials"
}
```

## GET /auth/me

Return the current user associated with the `Authorization: Bearer <token>` header.

**Responses**

- `200 OK`

```json
{
  "user": {
    "id": "user_123",
    "name": "Alex Builder",
    "email": "alex@buildtrack.com"
  }
}
```

- `401 Unauthorized`

```json
{
  "error": "Unauthorized"
}
```

## POST /auth/logout

Invalidate the current session token.

**Responses**

- `200 OK`

```json
{
  "ok": true
}
```

## Notes

- Contract is locked for MVP to keep frontend and tests stable.
- Backend storage can change without altering this contract.
- Any changes to these response shapes require coordinated frontend updates.
