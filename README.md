# AuthCore

Centralized **authentication** and **session management** API for web and mobile clients. AuthCore issues JWT access tokens, stores refresh tokens in **HttpOnly cookies** (with database-backed sessions), validates input with **Zod**, and exposes a small REST surface for users and devices.

---

## Table of contents

1. [Features](#features)
2. [Stack](#stack)
3. [Repository layout](#repository-layout)
4. [Quick start](#quick-start)
5. [Scripts](#scripts)
6. [HTTP API](#http-api)
   - [Base path and utilities](#base-path-and-utilities)
   - [Authentication](#authentication)
   - [User](#user)
   - [Sessions](#sessions)
7. [Sessions and tokens](#sessions-and-tokens)
8. [Errors](#errors)
9. [Environment variables](#environment-variables)
10. [Production notes](#production-notes)
11. [Roadmap](#roadmap)

---

## Features

- **Registration and email verification** with OTP (Resend + SMTP configuration in env).
- **Login / logout / logout-all** with refresh token rotation and session records (user-agent and IP).
- **JWT access tokens** (RS256-style key pair via `JWT_ACCESS_*` env keys) and configurable cookie names and SameSite/Secure flags.
- **Rate limiting**: global cap per IP plus stricter limits on auth and OTP routes.
- **Security middleware**: Helmet (including cross-origin resource policy for credentialed browser clients), CORS allowlist, JSON body size limit (`10kb`), `trust proxy` driven by config.
- **OpenAPI / Swagger UI** at `/docs` when enabled (off by default in production unless overridden).
- **Health check** at `GET /health` for orchestration and load balancers.

---

## Stack

| Area | Technology |
|------|------------|
| Runtime | Node.js **≥ 22** |
| Package manager | **pnpm** 10.x |
| HTTP | **Express** 5.x (ES modules) |
| Database | **MongoDB** + **Mongoose** 9.x |
| Validation | **Zod** 4.x |
| Auth | **bcrypt**, **jsonwebtoken**, cookie-based refresh |
| Docs | **swagger-jsdoc**, **swagger-ui-express** |
| Email | **Resend** (API) + SMTP env for pipeline flexibility |
| Logging | **morgan** (`combined` in production, `dev` otherwise; skipped in `test`) |

---

## Repository layout

```
src/
├── app.js                 # Express app: middleware, routes, Swagger, health
├── server.js              # DB connect, listen, graceful shutdown (SIGINT/SIGTERM)
├── config/
│   ├── db.js              # MongoDB connection
│   ├── env.js             # Zod-validated environment
│   ├── resend.js          # Resend client wiring
│   └── swagger.js         # OpenAPI spec generation and path prefixing
├── middleware/            # JWT, validation, rate limits, errors, service identity
├── modules/
│   ├── auth/              # Register, login, refresh, verify, logout, password
│   ├── sessions/          # List and revoke sessions
│   └── users/             # Profile (me)
├── services/mail/        # Email helpers and templates
└── utils/                 # AppError, tokens, OTP, client info helpers
```

---

## Quick start

**Prerequisites:** Node.js 22+, pnpm 10+, a MongoDB instance, and valid values for every variable in [Environment variables](#environment-variables) (the app exits on startup if validation fails).

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Create `.env`** in the project root and fill in all required keys (see the table below). There is no committed `.env.example`; use your own secrets store or team template.

3. **Run the API**

   ```bash
   pnpm run dev
   ```

   The server listens on **`APP_PORT`** (default **5000**). Interactive API docs are at **`http://localhost:<APP_PORT>/docs`** when `ENABLE_API_DOCS` is true (default in non-production).

---

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm run dev` | Development with **nodemon** (`src/server.js`). |
| `pnpm run start` | Production-style start (`node src/server.js`). Set `NODE_ENV=production` in the environment. |
| `pnpm run lint` | ESLint. |
| `pnpm run lint:fix` | ESLint with `--fix`. |
| `pnpm run format` | Prettier write. |
| `pnpm run check:format` | Prettier check only. |

---

## HTTP API

### Base path and utilities

JSON routes are mounted under **`API_PREFIX`**, which must start with `/` (default **`/api/v1`**).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness: `{ status, uptime, timestamp }` (not under `API_PREFIX`). |
| `GET` | `/docs` | Swagger UI when `ENABLE_API_DOCS` is `true`. |

**Example base for resources:** `{origin}{API_PREFIX}` → `http://localhost:5000/api/v1`

Unless noted, protected routes need **`Authorization: Bearer <access_token>`** and may rely on the refresh cookie for refresh/logout behavior.

### Authentication

All paths below are relative to **`{API_PREFIX}/auth`**. With the default prefix, **`POST /api/v1/auth/register`** means `POST {APP_URL}/api/v1/auth/register`.

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/register` | Body: `name`, `email`, `password`. Sends verification OTP. |
| `POST` | `/login` | Body: `email`, `password`. Optional header `x-target-audience`. Stricter rate limit. |
| `POST` | `/refresh` | Uses refresh cookie; optional `x-target-audience`. |
| `POST` | `/resend-verification` | Body: `email`. OTP rate limited. |
| `POST` | `/verify` | Body: `email`, `otp`. |
| `POST` | `/logout` | **Auth required.** |
| `POST` | `/logout-all` | **Auth required.** |
| `PATCH` | `/change-password` | **Auth required.** Body: `oldPassword`, `newPassword`. |

### User

Relative to **`{API_PREFIX}/user`**. All routes require a valid access token.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/me` | Current user profile. |
| `PATCH` | `/me` | Update profile (validated body, e.g. name). |
| `DELETE` | `/me` | Deactivate account and related sessions. |

### Sessions

Relative to **`{API_PREFIX}/session`**. All routes require a valid access token.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List sessions for the current user. |
| `DELETE` | `/` | Revoke all sessions for the user. |
| `GET` | `/:sessionId` | Session detail. |
| `DELETE` | `/:sessionId` | Revoke one session. |

---

## Sessions and tokens

1. **Login or verify** creates a **session** document (user agent, IP, expiry) and sets the refresh token in an **HttpOnly** cookie named **`refreshToken`** (`secure` in production, `sameSite: strict` in `auth.controller.js`). Env vars such as `REFRESH_COOKIE_NAME` and `COOKIE_*` are validated at startup; align the controller with them if you need custom names or domain-wide cookies.
2. **Access tokens** are short-lived JWTs; when they expire, the client calls **`POST .../auth/refresh`** with the refresh cookie.
3. **Rotation**: refresh handling uses **`rotateSession`** so a used refresh token is replaced; invalid or reused tokens can invalidate the session chain (see service logic for your security model).
4. **Logout** clears the current refresh session; **logout-all** and session DELETE endpoints revoke broader state.

---

## Errors

Responses use a single JSON shape (see `src/middleware/error.middleware.js`):

```json
{
  "status": "error",
  "error": {
    "message": "Human-readable message"
  }
}
```

- **`AppError`**: status and message from the handler (e.g. 404, 403 CORS rejection).
- **`ZodError`**: normalized to **400** with the first issue message.
- **Production**: no stack traces in the JSON body. **Non-production**: `error.stack` may be included for `Error` instances.

---

## Environment variables

Configuration is loaded with **`dotenv`** and validated in **`src/config/env.js`**. Types are coerced where noted (e.g. booleans from `"true"` / `"false"`).

### Application

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` \| `production` \| `test` (default `development`). |
| `APP_NAME` | Display default `AuthCore`. |
| `APP_PORT` | Listen port (default `5000`). |
| `APP_URL` | Public base URL of **this API** (used in OpenAPI `servers`, e.g. `https://api.example.com`). |
| `CLIENT_URL` | Frontend URL (used where redirects or client links are needed). |
| `API_PREFIX` | Mount prefix for auth/user/session routes; must start with `/` (default `/api/v1`). |
| `LOG_LEVEL` | `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace`. |
| `TRUST_PROXY` | `true` when behind a reverse proxy (sets Express `trust proxy`). |

### Documentation

| Variable | Description |
|----------|-------------|
| `ENABLE_API_DOCS` | If unset/empty: **`true`** when `NODE_ENV !== "production"`**, else **`false`**. Set explicitly to `true` / `false` / `1` / `0` / `yes` / `no` to override. |

### Database

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string. |
| `MONGODB_DB_NAME` | Database name. |

### JWT and session crypto

| Variable | Description |
|----------|-------------|
| `JWT_ACCESS_PRIVATE_KEY` | PEM private key (min length enforced). |
| `JWT_ACCESS_PUBLIC_KEY` | PEM public key. |
| `JWT_ACCESS_EXPIRES_IN` | Access JWT duration (e.g. `15m`). |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime string. |
| `JWT_ISSUER` | JWT `iss`. |
| `JWT_AUDIENCE` | JWT `aud`. |
| `REFRESH_TOKEN_BYTES` | Integer `32`–`128`. |
| `SESSION_EXPIRY_DAYS` | Session document expiry. |

### Passwords and cookies

| Variable | Description |
|----------|-------------|
| `BCRYPT_SALT_ROUNDS` | `10`–`14`. |
| `COOKIE_DOMAIN` | Cookie `Domain`. |
| `COOKIE_SECURE` | `Secure` flag. |
| `COOKIE_SAME_SITE` | `lax` \| `strict` \| `none`. |
| `ACCESS_COOKIE_NAME` | Reserved / future use (access token is returned in JSON today). |
| `REFRESH_COOKIE_NAME` | Reserved / future use (code currently uses the literal cookie name `refreshToken`). |

### Rate limiting

| Variable | Description |
|----------|-------------|
| `RATE_LIMIT_WINDOW_MS` | Global window length (ms). |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per IP per global window. |
| `AUTH_RATE_LIMIT_MAX` | Max requests per IP for the auth limiter window (see `rateLimit.middleware.js`). |

### CORS

| Variable | Description |
|----------|-------------|
| `CORS_ORIGIN` | Comma-separated list of allowed **origins** (each a full URL, e.g. `https://app.example.com,http://localhost:5173`). |
| `CORS_CREDENTIALS` | Whether browsers may send cookies on cross-origin requests. |

### Email

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Must start with `re_`. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | SMTP pipeline configuration. |
| `EMAIL_VERIFICATION_EXPIRES_IN` | OTP / verification TTL string. |
| `PASSWORD_RESET_EXPIRES_IN` | Reset flow TTL string. |

### Other

| Variable | Description |
|----------|-------------|
| `CLOUDINARY_NAME` / `CLOUDINARY_KEY` / `CLOUDINARY_SECRET` | Cloudinary (required by current schema; used if you wire uploads). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional OAuth. |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Optional OAuth. |

---

## Production notes

- Set **`NODE_ENV=production`**, **`TRUST_PROXY=true`** behind a trusted proxy, and tighten **`CORS_ORIGIN`** to real front-end origins only.
- Keep **`ENABLE_API_DOCS=false`** on public production clusters unless you intentionally expose `/docs`.
- **`APP_URL`** and **`API_PREFIX`** should match what clients and your OpenAPI “Try it out” requests use.
- The process handles **SIGTERM** / **SIGINT** by closing the HTTP server and the MongoDB connection; use the same signals in Docker/Kubernetes.
- Horizontal scaling is straightforward: session state lives in MongoDB; ensure all instances share the same DB and consistent **`JWT_*`** keys.

Example container outline:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile
COPY . .
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "src/server.js"]
```

Adjust **`EXPOSE`** to match **`APP_PORT`**.

---

## Roadmap

Possible next steps: OAuth social login (Google/GitHub env hooks exist), TOTP MFA, WebAuthn passkeys, richer RBAC, and outbound webhooks for identity events.

---

*AuthCore — centralized auth and session control for your product backends.*
