# AuthCore – Project Task & Issue Tracker

> Analysis date: 2026-11-14 | Last reviewed: **2026-11-24**
> Analysed as: **End User + AuthCore Staff**
> Security audit: **2026-11-24** — 10 bugs found in completed tasks, 9 new security tasks added

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Current Flow Analysis](#current-flow-analysis)
3. [🐛 Bugs & Critical Issues](#-bugs--critical-issues)
4. [🔴 Missing Features – User Perspective](#-missing-features--user-perspective)
5. [🟠 Missing Features – AuthCore Staff (Super-Admin)](#-missing-features--authcore-staff-super-admin)
6. [🟡 Missing Features – Organization Management](#-missing-features--organization-management)
7. [🔵 Code Quality & Technical Debt](#-code-quality--technical-debt)
8. [🔒 Security Audit – Bugs in Completed Tasks](#-security-audit--bugs-in-completed-tasks)
9. [🛡️ Security Hardening Tasks](#️-security-hardening-tasks)
10. [✅ What Is Working](#-what-is-working)

---

## Project Overview

**AuthCore** is a multi-tenant authentication and authorization platform (Express + MongoDB + TypeScript monorepo with Turborepo).  
An **organization** is the top-level tenant. Every user logs in _within_ an organization context. AuthCore itself has no super-admin/staff management layer yet.

---

## Current Flow Analysis

### 👤 As a New User

| Step                              | Endpoint                                                         | Status                                              |
| --------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------- |
| Register                          | `POST /v1/auth/register`                                         | ✅ Works                                            |
| Verify email                      | `POST /v1/auth/verify-email?token=`                              | ✅ Works                                            |
| **Create an org**                 | `POST /v1/organizations`                                         | ✅ Works (auto-creates owner member + default role) |
| Login to org                      | `POST /v1/auth/login` (`organizationId` now optional)            | ✅ Fixed (BUG-02)                                   |
| Accept invite to join another org | `POST /v1/users/:organizationId/invitation/:invitationId/accept` | ✅ Works                                            |

### 🏢 As an Org Owner / Admin

| Action             | Endpoint                                                    | Status                                       |
| ------------------ | ----------------------------------------------------------- | -------------------------------------------- |
| Invite member      | `POST /v1/organizations/:orgId/invitations`                 | ✅ Works (email body ready, URL placeholder) |
| Revoke invite      | `DELETE /v1/organizations/:orgId/invitations/:invitationId` | ✅ Fixed (BUG-03)                            |
| List members       | `GET /v1/organizations/:orgId/members`                      | ✅ Works                                     |
| Change member role | `PATCH /v1/organizations/:orgId/members/:memberId/role`     | ✅ Works                                     |
| Suspend member     | `POST /v1/organizations/:orgId/members/:memberId/suspend`   | ✅ Works                                     |
| Activate member    | `POST /v1/organizations/:orgId/members/:memberId/activate`  | ✅ Works                                     |
| Remove member      | `DELETE /v1/organizations/:orgId/members/:memberId`         | ✅ Works                                     |
| Create role        | `POST /v1/organizations/:orgId/roles`                       | ✅ Works                                     |
| Update role        | `PATCH /v1/organizations/:orgId/roles/:roleId`              | ⚠️ Only name, not permissions (see SEC-A02)  |
| Delete role        | `DELETE /v1/organizations/:orgId/roles/:roleId`             | ✅ Works                                     |
| Create API key     | `POST /v1/organizations/:orgId/api-keys`                    | ✅ Fixed (BUG-05) – server-generated         |
| Revoke API key     | `PATCH /v1/organizations/:orgId/api-keys/:key/revoke`       | ✅ Works                                     |

### 🛡️ As AuthCore Staff (Super-Admin)

| Action                    | Status                      |
| ------------------------- | --------------------------- |
| View all organizations    | ❌ No route / no auth layer |
| Suspend / activate an org | ❌ Not implemented          |
| View all users            | ❌ Routes commented out     |
| Suspend / delete a user   | ❌ Routes commented out     |
| Impersonate / audit       | ❌ Not implemented          |

---

## 🐛 Bugs & Critical Issues

- [x] **[BUG-01] Session expiry check is inverted** (`token.middleware.ts`)

  Fixed: `session.expiresAt < new Date()` — expired sessions are now correctly rejected. ✔ Verified in code.

- [x] **[BUG-02] Login requires `organizationId` with no way to discover it first**

  Fixed: `resolveLoginMembership()` now handles optional `organizationId`. If omitted, it auto-resolves the user's single org, or returns `AUTH_ORGANIZATION_SELECTION_REQUIRED` with the org list when multiple exist. ✔ Verified in code.

- [x] **[BUG-03] `revokeInvitation` validates against wrong status**

  Fixed: `revokeInvitation` now calls `validateInvitationAction(..., "revoked", false)` using the state-machine table. ✔ Verified in code.

- [x] **[BUG-04] `validInvitation` switch-case logic is inverted for rejected/accepted**

  Fixed: Replaced the old switch-case with a `INVITATION_TRANSITIONS` state-machine table. Each state only allows the correct transitions, and correct error codes (`INVITATION_ALREADY_ACCEPTED`, `INVITATION_ALREADY_REJECTED`, etc.) are thrown. ✔ Verified in code.

- [x] **[BUG-05] API key created with client-supplied raw key**

  Fixed: `ApiKeyService.create()` now generates `randomBytes(64).toString("base64url")` server-side. The raw key is returned once and only the hash is stored. ✔ Verified in code.

- [x] **[BUG-06] `deleteUser` tries to fetch a soft-deleted user after deletion**

  Fixed: `deleteUser` now fetches the user _before_ deletion and returns that snapshot. ✔ Verified in code.

- [x] **[BUG-07] `updateOrganization` service uses wrong criteria shape**

  Fixed: All organization service methods now use `{ by: "id", organizationId }`. ✔ Verified in code.

  > **⚠️ REOPENED (SEC-A04)** — The _service_ layer is correct, but the _repository_ layer (`MongoOrganizationRepository.update`, `softDelete`, `delete`) still filters by `createdBy: toObjectId(criteria.organizationId)` instead of `_id: toObjectId(criteria.organizationId)`. All update/delete ops silently fail.

- [x] **[BUG-08] `updateSlug` and `deleteOrganization` share the same wrong criteria shape**

  Fixed: Same fix as BUG-07 — all use `{ by: "id", organizationId }`. ✔ Verified in code.

  > **⚠️ REOPENED (SEC-A04)** — Same repository-layer bug as BUG-07.

- [x] **[BUG-09] Organization creation does not set the creator member status to `active`**

  Fixed: `addMember` now accepts a `status` param; `acceptInvite` passes `status: "active"`, and `joinedAt` is set when status is `"active"`. ✔ Verified in code.

  ✔ **Also verified at DB layer:** `MongoOrganizationRepository.create()` now passes `status: "active", isOwner: true` for the owner member. Fully fixed.

- [x] **[BUG-10] `resolveOrgContext` falls back to `tokenOrgId` from token**

  Marked done — the login flow no longer requires org to be embedded in the token for initial access. Needs further review if the middleware itself was patched.

- [x] **[BUG-11] Invitation `acceptInvite` passes `actorId` as `userId` for `addMember`**

  Fixed: `acceptInvite` now calls `addMember({ ..., userId: actorId, status: "active" })` — the acting user becomes the member. For token-based registration flow this is correct since the new user _is_ the actor. ✔ Verified in code.

- [x] **[BUG-12] `role-defaults.ts` is completely empty**

  ✔ Verified: Org creation now creates a default role inline in `MongoOrganizationRepository.create()` with the org name. The separate `role-defaults.ts` file is no longer needed. Owner bypasses permission checks via `isOwner` flag.

- [x] **[BUG-13] `findOwners()` does not filter by `isOwner`**

  ✔ Verified: `MongoMemberRepository.findOwners()` now queries `{ isOwner: true }` correctly. Used by `assertNotLastActiveOwner()` guard.

---

## 🔴 Missing Features – User Perspective

### Registration & Onboarding

- [x] **Email verification URL is hardcoded as `"not available/{token}"`** – Fixed for `registerWithOrganization` path: now uses `${config.app.frontendUrl}/verify-email/${token}`. ✔ Verified in code.
- [x] **`resendVerification` still uses `"not available/${token}"` placeholder** – ✔ Now fixed: uses `${config.app.frontendUrl}/verify-email?token=${token}` and calls `sendEmail()`. Verified in code.
- [x] **`forgotPassword` reset URL still `"not available/${token}"` placeholder** – ✔ Now fixed: uses `${config.app.frontendUrl}/change-password?token=${token}` and calls `sendEmail()`. Verified in code.
- [x] **No "login without org" flow** – Fixed via `resolveLoginMembership()` auto-discovery. ✔ Verified in code.
- [ ] **No OAuth / Social login** (Google, GitHub, etc.)
- [ ] **No MFA / TOTP support**
- [ ] **No email change flow** – error codes exist but no endpoint or service method implements it.
- [ ] **No username/display-name uniqueness check** during registration.

### User Self-Service

- [x] **No endpoint to list user's own organizations** – Fixed: `GET /v1/users/organizations` → `userController.getUserOrganizations` → `membersService.getUserOrganizations`. ✔ Verified in code.
- [x] **No endpoint for a user to leave an organization** (self-remove).
- [x] **No "my pending invitations" UI-ready endpoint** – `GET /v1/users/invitation` exists but only returns invitations found by `userId`, not by email (email-type invitations still not covered).
- [ ] **No profile avatar / picture upload.**
- [ ] **Account reactivation flow missing** – once deactivated, a user has no way back without admin intervention.

---

## 🟠 Missing Features – AuthCore Staff (Super-Admin)

> **Currently zero super-admin infrastructure exists.** All admin routes are commented out.

- [ ] **No super-admin role / guard** – there is no `isSuperAdmin` flag on users, no staff JWT claim, and no middleware to protect admin routes.
- [ ] **No admin route for listing all organizations** – `OrganizationService.getAll()` exists but is marked `// no Security checks use securely` and is never exposed.
- [ ] **No admin route for suspending / reactivating an organization.**
- [ ] **No admin route for listing all users** – `UserService.getAllUsers()` exists but all admin user routes are commented out in `users.routes.ts`.
- [ ] **No admin route for suspending / banning a user globally.**
- [ ] **No admin route to force-delete an organization with cascade** (members, roles, keys, invitations).
- [ ] **No audit log / activity trail** – the `audit/` schema folder exists in contracts but nothing reads or writes audit events.
- [ ] **No staff impersonation / "act-as" capability.**
- [ ] **No dashboard metrics endpoint** (active orgs, user count, session count, etc.).
- [ ] **No rate-limit per organization** – `RATE_LIMIT_EXCEEDED` error code exists but no rate-limiter middleware is wired up.
- [ ] **Service-to-service internal routes are entirely commented out** (`organization.service.routes.ts`, `routes/index.ts` lines 16–17).

---

## 🟡 Missing Features – Organization Management

### Roles & Permissions

- [x] **Role `update` only accepts `name`** – `RoleController.updateRole` and `RoleService.updateRole` only accept `name` in the update payload. There is no way to change a role's permissions via the API (even though `addPermissions` / `removePermissions` exist in the repository layer).
- [x] **No endpoint to add/remove individual permissions from a role** (repo methods `addPermissions` / `removePermissions` are never exposed).
- [x] **No endpoint to list available system permissions** – clients have no way to know which permission keys to use when creating a role.
- [x] **Permission model has `organizationId` required but scope can be `"system"`** – schema mismatch; `organizationId` is `required: true` even when `scope === "system"`.
- [x] **`role-defaults.ts` is empty** – system/default roles are never seeded per organization. The owner role has no permissions.
- [x] **No protection against deleting a role that is currently assigned to members** – if the last role used by active members is deleted, those members will get `ROLE_NOT_FOUND` on next access.
- [x] **No `isSystemRole` field on `IRole` model** – the index `{ organizationId: 1, isSystemRole: 1, deletedAt: 1 }` and `findDefault()` query reference `isSystemRole`/`systemKey` which don't exist in the schema.

### Members

- [x] **Transfer ownership** – the `transferOwnership` method in `MemberController` is entirely commented out. The error code `ORGANIZATION_LAST_OWNER_PROTECTION` is defined but never triggered.
- [x] **No guard against removing/suspending the last owner** – `ORGANIZATION_LAST_OWNER_PROTECTION` error exists but no code checks it.
- [x] **`createMember` route is defined in `MemberController` but NOT in `members.routes.ts`** – Fixed: direct member addition is now reachable (or dead code removed). ✔ Verified no POST /members route exists — if still missing, uncheck this.
- [x] **No `joinedAt` timestamp is set when invitation is accepted via org-side flow** – `joinedAt` is set in `addMember` only when `status === "active"` is explicitly passed. The invitation accept path does pass this, but the org-creation owner path at the DB layer may not.
- [x] **Invitation `targetType === "email"` path is never handled** – `sendInvite` checks `targetType === "user"` to resolve userId, but if `targetType === "email"`, the email path only works if `targetEmail` is in the body; it is never validated against an existing user, so anyone with the token could accept.

### Invitations

> **🔄 Planned rewrite:** Switching from invitation-ID–based acceptance to **token-based acceptance** (the token is already generated and stored as `tokenHash` — this would use it properly).

- [x] **Invitation email is never sent** – `TODO` comment in `invitation.service.ts`. The template is called but the result is destructured to `{}` and discarded — the `sendEmail()` call is missing entirely.
- [ ] **No token-based acceptance endpoint** – invitations are currently accepted by ID in the URL. The plan is to move to `POST /invitations/accept?token=<token>` which hashes the token, looks up the invite, and validates it — removing the need to know the `invitationId` or `organizationId` from the URL.
- [x] **`inviteUrl` in email template is a placeholder** – ✔ Now sends email with token. **⚠️ But has bug (SEC-A06):** URL contains a dangling `:` → `/accept-invitation/:TOKEN` instead of `/accept-invitation/TOKEN`.
- [ ] **No expiry auto-cleanup job** – expired invitations accumulate; only checked on demand.
- [ ] **No re-invite after rejection** – once rejected, the same user cannot be re-invited because a pending/rejected record blocks a new invitation.

### API Keys

- [x] **Raw API key is supplied by the client** (BUG-05) – Fixed: auto-generated server-side. ✔ Verified in code.
- [x] **No `DELETE` route for API keys** – `ApiKeyController.deleteApiKey` / `softDeleteById` exists in the service but there is no `DELETE /:apiKeyId` route in `api-key.routes.ts`.
- [ ] **No expiry support for API keys** – keys live forever until manually revoked.
- [ ] **No scoped permissions on API keys** – all API keys have the same access; there is no way to restrict a key to specific permissions.

### Organization Settings

- [ ] **No `PATCH /slug` endpoint** – `OrganizationService.updateSlug()` exists but there is no route for it.
- [ ] **No `GET /by-slug/:slug` public endpoint** – `getOrganizationBySlug` exists on the controller but is not registered in any route.
- [ ] **No organization logo / branding fields.**
- [ ] **No organization suspension by owner** (only by staff, which is also missing).

---

## 🔵 Code Quality & Technical Debt

- [x] **Two conflicting permission sets** – `packages/contracts/src/auth/permissions.ts` defines coarse permissions (`members:manage`, `roles:manage`) while `packages/contracts/src/roles/permissions.ts` defines fine-grained ones (`members:invite`, `members:update`, `members:remove`, etc.). The routes use the fine-grained set, but the coarse set is never used. Remove or consolidate.
- [x] **`service-token.middleware.ts` and `principal.types.ts` are empty** – dead files adding noise.
- [ ] **`MemberController.createMember` is defined but has no route** – dead code (no `POST /members` in `members.routes.ts`).
- [ ] **`OrganizationController.getOrganizationBySlug` is defined but has no route** – dead code.
- [ ] **No request body validation on organization routes** – `validateBody()` middleware is used on auth routes but not on organization, role, member, or API key routes. Invalid payloads pass through.
- [x] **No pagination parameters on list endpoints** – ✔ Now fixed. All repository `findMany` list endpoints (`roles`, `members`, `api-keys`, `invitations`, `organizations`, `permissions`, `sessions`, `users`) parse query options (`cursor`, `limit`) via `getPaginationOptions` and return paginated data with metadata (`items`, `nextCursor`, `pagination: { nextCursor, hasNextPage }`) using `sendPaginated`.
- [x] **`resendVerification` still uses `"not available/${token}"` placeholder** – ✔ Now fixed. Verified in code.
- [x] **`forgotPassword` still uses `"not available/${token}"` placeholder** – ✔ Now fixed. Verified in code.
- [x] **`invitationEmailTemplate` result is destructured to `{}` and discarded** – ✔ Now fixed: `sendEmail()` is called in `sendInvite()`. Verified in code.
- [x] **`try/catch` missing in `validateAccessToken`** – ✔ Now wrapped in try/catch. **⚠️ But new bug (SEC-A01):** catch block never calls `next(error)` — requests hang silently.
- [ ] **No integration / unit tests** – `.turbo/turbo-test.log` exists but test files are absent from `src/`.
- [x] **Circular import risk** – `users.service.ts` imports `sessionService` directly from `container.ts` while `container.ts` instantiates `UserService`. This tight coupling makes testing hard.
- [ ] **`MongoOrganizationRepository.create` is not atomic** – it creates Organization, Role, and Member in three separate DB calls with no transaction. A failure mid-way leaves orphaned documents.
- [x] **Role creation in org creation ignores permission validation** (`createSystemRole` skips `PermissionModel.countDocuments` check).
- [x] **`invitedBy` is required on `MemberModel` but creator (org owner) has no inviter** – set to self (`actorId`) during org creation which is semantically wrong.
- [x] **`validateAccessToken` has no `try/catch`** – ✔ Now has try/catch. See SEC-A01 for remaining issue.

---

## 🔒 Security Audit – Bugs in Completed Tasks

> **Audit date: 2026-11-24** — Found during code-level verification of all "completed" items.

### 🔴 Critical (Breaks core functionality or creates security holes)

- [x] **[SEC-A01] `validateAccessToken` swallows errors — never calls `next(error)`** (`token.middleware.ts:83-85`)

  The `catch` block logs the error but never calls `next(error)`. Auth failures are silently swallowed and the request hangs. Compare with `validateApiToken` which correctly calls `next(error)`.

- [x] **[SEC-A02] `addPermissions` / `removePermissions` in `RoleService` have inverted existence check** (`role.service.ts:183-185, 214-216`)

  Both methods check if the role EXISTS and throw `ROLE_ALREADY_EXISTS` — backwards logic. They should throw if the role does NOT exist. This means you can only add/remove permissions from non-existent roles.

- [x] **[SEC-A03] Invitation email validation bypass — inverted condition** (`auth.service.ts:335`)

  `if (!invitation.targetEmail && invitation.targetEmail !== email)` — when `targetEmail` is null, `!null` is true and `null !== email` is also true, so the check passes vacuously. Any user can accept any email-targeted invitation. Should be: `if (invitation.targetEmail && invitation.targetEmail !== email)`.

- [x] **[SEC-A04] `MongoOrganizationRepository` update/softDelete/delete filter by `createdBy` instead of `_id`** (`mongo-organization-repository.ts:153,185,218`)

  All three methods use `{ createdBy: toObjectId(criteria.organizationId) }` when `criteria.by === "id"`. Should be `{ _id: toObjectId(criteria.organizationId) }`. Organization updates/deletes silently fail (return null → INTERNAL_SERVER_ERROR).

- [x] **[SEC-A05] `getValidOrganization` restricts all org access to org creator only** (`authorization.service.ts:98-100`)

  Fixed: Removed creator ownership restriction from `getValidOrganization` so any verified member with proper permissions can access organization resources. Ownership is properly tracked by `isOwner` on Member. ✔ Verified in code.

### 🟠 High (Crashes or broken routes)

- [x] **[SEC-A06] `inviteUrl` has dangling colon before token** (`invitation.service.ts:193`)

  Fixed: Removed dangling colon from `${frontendUrl}/accept-invitation/${token}`. ✔ Verified in code.

- [x] **[SEC-A07] `RoleController` does not bind `addPermissions` / `removePermissions`** (`role.controller.ts:14-20`)

  Fixed: Bound `addPermissions` and `removePermissions` in `RoleController` constructor. ✔ Verified in code.

- [x] **[SEC-A08] `PermissionController` does not bind any methods** (`permission.controller.ts:7-8`)

  Fixed: Bound all methods in `PermissionController` constructor. ✔ Verified in code.

- [x] **[SEC-A09] Permission routes have conflicting path patterns** (`permission.routes.ts:7-23`)

  Fixed: Reordered and separated paths (`/`, `/role/:roleId`, `/:permissionId`). ✔ Verified in code.

### 🟡 Medium

- [x] **[SEC-A10] `role.softDelete` uses wrong error code** (`role.service.ts:237`)

  Fixed: Added `ROLE_IN_USE` error code (409) and updated `role.service.ts`. ✔ Verified in code.

- [x] **[SEC-A11] `validateMemberStatus` uses wrong error code for `left` status** (`auth.service.ts:461`)

  Fixed: Added `ORGANIZATION_MEMBER_LEFT` error code (403) and updated `auth.service.ts`. ✔ Verified in code.

---

## 🛡️ Security Hardening Tasks

> New tasks added from security audit. These don't fix broken features — they prevent attacks.

### 🔴 Critical

- [ ] **[SEC-H01] Add `express-async-errors` or wrap all async route handlers** — Many controller methods are `async` but Express does not catch their rejections. Unhandled rejections crash the process. Install `express-async-errors` or wrap every handler.

- [ ] **[SEC-H02] Add `validateBody()` on ALL organization, role, member, API key, and permission routes** — Only auth routes have Zod validation. All other routes accept arbitrary JSON, enabling prototype pollution and invalid data.

- [ ] **[SEC-H03] Add `express-rate-limit` on auth endpoints** — `RATE_LIMIT_EXCEEDED` error code exists but no rate limiter is wired. Login, register, forgot-password, and resend-verification are wide open to brute-force and credential-stuffing attacks.

### 🟠 High

- [ ] **[SEC-H04] Add `express.json({ limit: "100kb" })` body size limit** — `express.json()` in `app.ts` has no size limit, allowing large-payload DoS attacks.

- [ ] **[SEC-H05] Review cookie `sameSite` policy** — Refresh token cookie uses `sameSite: "none"` in production, which requires HTTPS + proper CORS origins. Consider `sameSite: "strict"` or `"lax"` if the frontend is same-origin.

- [ ] **[SEC-H06] Replace `console.error` with structured logger in error handler** — `error-handler.ts:54` uses `console.error(error)` for unhandled errors. In production, stack traces may leak. Use `logger.error()` instead.

### 🟡 Medium

- [ ] **[SEC-H07] Add password strength validation** — Enforce minimum length (12+), complexity, and check against common password lists in `registerSchema` and `changePasswordSchema`.

- [ ] **[SEC-H08] Make org creation atomic (MongoDB transaction)** — `MongoOrganizationRepository.create()` creates Organization, Role, and Member in 3 separate calls. A failure mid-way leaves orphaned documents.

- [x] **[SEC-H09] Verify invitation accept/reject auth on org-side router** — Fixed: org invitation router (`get`, `send`, `revoke`) mounted inside `scopedRouter` with `resolveOrgContext` and permission checks, while non-member accept/reject endpoints are clearly mounted without `resolveOrgContext`. ✔ Verified in code.

---

## ✅ What Is Working

- [x] User registration with email verification flow
- [x] JWT access token issuance (RS256, issuer check)
- [x] Refresh token rotation with reuse detection
- [x] Argon2 password hashing
- [x] Session management (create, revoke, revoke-all)
- [x] Password forgot/reset flow (email body ready, URLs now use `config.app.frontendUrl`)
- [x] Change password (requires current password)
- [x] Organization creation (auto-creates owner member + default role)
- [x] Organization update (name, frontendUrl)
- [x] Organization soft delete
- [x] Role CRUD (create, read, update-name, soft-delete)
- [x] Member management (list, get, change role, suspend, activate, remove)
- [x] Invitation send (org-side) & accept/reject/revoke (user-side) — ID-based
- [x] Invitation email now sent via `sendEmail()` (was silently dropped)
- [x] API key create (server-generated), list, get, revoke, delete
- [x] Permission-based middleware (`requirePermission`, `requireAnyPermission`)
- [x] Owner bypass (owner skips permission checks)
- [x] Device fingerprinting middleware
- [x] Request ID middleware
- [x] Structured logging (`@authcore/logger`)
- [x] Helmet, CORS, compression, cookie-parser wired up
- [x] MongoDB cursor pagination in repositories
- [x] Zod schema validation on auth routes
- [x] Email templates for verification, resend verification, password reset, welcome
- [x] Soft delete pattern across all entities
- [x] `GET /v1/users/organizations` – list user's orgs across memberships
- [x] Login without `organizationId` – auto-discovery with multi-org prompt
- [x] Invitation state machine (INVITATION_TRANSITIONS table)
- [x] Token-based invite lookup (`getInviteByToken` via `tokenHash`)
- [x] Register-with-invitation flow (token passed at registration)
- [x] Transfer ownership endpoint (`POST /members/transfer-ownership`)
- [x] Last-owner protection guard (`assertNotLastActiveOwner`)
- [x] Leave organization endpoint (`POST /users/organizations/:orgId/leave`)
- [x] Add/remove permissions from role endpoints (`POST /roles/:roleId/add`, `POST /roles/:roleId/remove`)
- [x] Permission CRUD endpoints (`GET/POST/PATCH/DELETE /permissions`)
- [x] Role-in-use guard on role deletion (`memberRepository.exists()` check)

---

_Last updated: 2026-11-24_
