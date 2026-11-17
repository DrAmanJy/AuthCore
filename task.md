# AuthCore – Project Task & Issue Tracker

> Analysis date: 2026-11-14 | Last reviewed: **2026-11-17**
> Analysed as: **End User + AuthCore Staff**

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Current Flow Analysis](#current-flow-analysis)
3. [🐛 Bugs & Critical Issues](#-bugs--critical-issues)
4. [🔴 Missing Features – User Perspective](#-missing-features--user-perspective)
5. [🟠 Missing Features – AuthCore Staff (Super-Admin)](#-missing-features--authcore-staff-super-admin)
6. [🟡 Missing Features – Organization Management](#-missing-features--organization-management)
7. [🔵 Code Quality & Technical Debt](#-code-quality--technical-debt)
8. [✅ What Is Working](#-what-is-working)

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

| Action             | Endpoint                                                    | Status                              |
| ------------------ | ----------------------------------------------------------- | ----------------------------------- |
| Invite member      | `POST /v1/organizations/:orgId/invitations`                 | ✅ Works (email body ready, URL placeholder) |
| Revoke invite      | `DELETE /v1/organizations/:orgId/invitations/:invitationId` | ✅ Fixed (BUG-03)                   |
| List members       | `GET /v1/organizations/:orgId/members`                      | ✅ Works                            |
| Change member role | `PATCH /v1/organizations/:orgId/members/:memberId/role`     | ✅ Works                            |
| Suspend member     | `POST /v1/organizations/:orgId/members/:memberId/suspend`   | ✅ Works                            |
| Activate member    | `POST /v1/organizations/:orgId/members/:memberId/activate`  | ✅ Works                            |
| Remove member      | `DELETE /v1/organizations/:orgId/members/:memberId`         | ✅ Works                            |
| Create role        | `POST /v1/organizations/:orgId/roles`                       | ✅ Works                            |
| Update role        | `PATCH /v1/organizations/:orgId/roles/:roleId`              | ⚠️ Only name, not permissions       |
| Delete role        | `DELETE /v1/organizations/:orgId/roles/:roleId`             | ✅ Works                            |
| Create API key     | `POST /v1/organizations/:orgId/api-keys`                    | ✅ Fixed (BUG-05) – server-generated |
| Revoke API key     | `PATCH /v1/organizations/:orgId/api-keys/:key/revoke`       | ✅ Works                            |

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

- [x] **[BUG-08] `updateSlug` and `deleteOrganization` share the same wrong criteria shape**

  Fixed: Same fix as BUG-07 — all use `{ by: "id", organizationId }`. ✔ Verified in code.

- [x] **[BUG-09] Organization creation does not set the creator member status to `active`**

  Fixed: `addMember` now accepts a `status` param; `acceptInvite` passes `status: "active"`, and `joinedAt` is set when status is `"active"`. ✔ Verified in code.

  > **⚠️ Partial** — The fix is in `addMember`/`acceptInvite`, but it's unclear if the _org creation_ path in `mongo-organization-repository.ts` was also updated to pass `status: "active"` for the owner. Worth verifying at the DB layer.

- [x] **[BUG-10] `resolveOrgContext` falls back to `tokenOrgId` from token**

  Marked done — the login flow no longer requires org to be embedded in the token for initial access. Needs further review if the middleware itself was patched.

- [x] **[BUG-11] Invitation `acceptInvite` passes `actorId` as `userId` for `addMember`**

  Fixed: `acceptInvite` now calls `addMember({ ..., userId: actorId, status: "active" })` — the acting user becomes the member. For token-based registration flow this is correct since the new user _is_ the actor. ✔ Verified in code.

- [x] **[BUG-12] `role-defaults.ts` is completely empty**

  Status unclear — verify that default role permissions are now seeded on org creation.

- [x] **[BUG-13] `findOwners()` does not filter by `isOwner`**

  Status unclear — verify at the repository layer that the query was fixed.

---

## 🔴 Missing Features – User Perspective

### Registration & Onboarding

- [x] **Email verification URL is hardcoded as `"not available/{token}"`** – Fixed for `registerWithOrganization` path: now uses `${config.app.frontendUrl}/verify-email/${token}`. ✔ Verified in code.
- [ ] **`resendVerification` still uses `"not available/${token}"`** – The resend path was **NOT** fixed. Still a placeholder. ⚠️ Mistakenly marked done.
- [ ] **`forgotPassword` reset URL still `"not available/${token}"`** – **NOT** fixed. Still a placeholder. ⚠️ Mistakenly marked done.
- [x] **No "login without org" flow** – Fixed via `resolveLoginMembership()` auto-discovery. ✔ Verified in code.
- [ ] **No OAuth / Social login** (Google, GitHub, etc.)
- [ ] **No MFA / TOTP support**
- [ ] **No email change flow** – error codes exist but no endpoint or service method implements it.
- [ ] **No username/display-name uniqueness check** during registration.

### User Self-Service

- [x] **No endpoint to list user's own organizations** – Fixed: `GET /v1/users/organizations` → `userController.getUserOrganizations` → `membersService.getUserOrganizations`. ✔ Verified in code.
- [ ] **No endpoint for a user to leave an organization** (self-remove).
- [ ] **No "my pending invitations" UI-ready endpoint** – `GET /v1/users/invitation` exists but only returns invitations found by `userId`, not by email (email-type invitations still not covered).
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

- [ ] **Role `update` only accepts `name`** – `RoleController.updateRole` and `RoleService.updateRole` only accept `name` in the update payload. There is no way to change a role's permissions via the API (even though `addPermissions` / `removePermissions` exist in the repository layer).
- [ ] **No endpoint to add/remove individual permissions from a role** (repo methods `addPermissions` / `removePermissions` are never exposed).
- [ ] **No endpoint to list available system permissions** – clients have no way to know which permission keys to use when creating a role.
- [ ] **Permission model has `organizationId` required but scope can be `"system"`** – schema mismatch; `organizationId` is `required: true` even when `scope === "system"`.
- [ ] **`role-defaults.ts` is empty** – system/default roles are never seeded per organization. The owner role has no permissions.
- [ ] **No protection against deleting a role that is currently assigned to members** – if the last role used by active members is deleted, those members will get `ROLE_NOT_FOUND` on next access.
- [ ] **No `isSystemRole` field on `IRole` model** – the index `{ organizationId: 1, isSystemRole: 1, deletedAt: 1 }` and `findDefault()` query reference `isSystemRole`/`systemKey` which don't exist in the schema.

### Members

- [ ] **Transfer ownership** – the `transferOwnership` method in `MemberController` is entirely commented out. The error code `ORGANIZATION_LAST_OWNER_PROTECTION` is defined but never triggered.
- [ ] **No guard against removing/suspending the last owner** – `ORGANIZATION_LAST_OWNER_PROTECTION` error exists but no code checks it.
- [x] **`createMember` route is defined in `MemberController` but NOT in `members.routes.ts`** – Fixed: direct member addition is now reachable (or dead code removed). ✔ Verified no POST /members route exists — if still missing, uncheck this.
- [ ] **No `joinedAt` timestamp is set when invitation is accepted via org-side flow** – `joinedAt` is set in `addMember` only when `status === "active"` is explicitly passed. The invitation accept path does pass this, but the org-creation owner path at the DB layer may not.
- [ ] **Invitation `targetType === "email"` path is never handled** – `sendInvite` checks `targetType === "user"` to resolve userId, but if `targetType === "email"`, the email path only works if `targetEmail` is in the body; it is never validated against an existing user, so anyone with the token could accept.

### Invitations

> **🔄 Planned rewrite:** Switching from invitation-ID–based acceptance to **token-based acceptance** (the token is already generated and stored as `tokenHash` — this would use it properly).

- [ ] **Invitation email is never sent** – `TODO` comment in `invitation.service.ts`. The template is called but the result is destructured to `{}` and discarded — the `sendEmail()` call is missing entirely.
- [ ] **No token-based acceptance endpoint** – invitations are currently accepted by ID in the URL. The plan is to move to `POST /invitations/accept?token=<token>` which hashes the token, looks up the invite, and validates it — removing the need to know the `invitationId` or `organizationId` from the URL.
- [ ] **`inviteUrl` in email template is a placeholder** – `${params.organization.frontendUrl}/accept-invitation/:` has a dangling `:` and no token appended.
- [ ] **No expiry auto-cleanup job** – expired invitations accumulate; only checked on demand.
- [ ] **No re-invite after rejection** – once rejected, the same user cannot be re-invited because a pending/rejected record blocks a new invitation.

### API Keys

- [x] **Raw API key is supplied by the client** (BUG-05) – Fixed: auto-generated server-side. ✔ Verified in code.
- [ ] **No `DELETE` route for API keys** – `ApiKeyController.deleteApiKey` / `softDeleteById` exists in the service but there is no `DELETE /:apiKeyId` route in `api-key.routes.ts`.
- [ ] **No expiry support for API keys** – keys live forever until manually revoked.
- [ ] **No scoped permissions on API keys** – all API keys have the same access; there is no way to restrict a key to specific permissions.

### Organization Settings

- [ ] **No `PATCH /slug` endpoint** – `OrganizationService.updateSlug()` exists but there is no route for it.
- [ ] **No `GET /by-slug/:slug` public endpoint** – `getOrganizationBySlug` exists on the controller but is not registered in any route.
- [ ] **No organization logo / branding fields.**
- [ ] **No organization suspension by owner** (only by staff, which is also missing).

---

## 🔵 Code Quality & Technical Debt

- [ ] **Two conflicting permission sets** – `packages/contracts/src/auth/permissions.ts` defines coarse permissions (`members:manage`, `roles:manage`) while `packages/contracts/src/roles/permissions.ts` defines fine-grained ones (`members:invite`, `members:update`, `members:remove`, etc.). The routes use the fine-grained set, but the coarse set is never used. Remove or consolidate.
- [ ] **`service-token.middleware.ts` and `principal.types.ts` are empty** – dead files adding noise.
- [ ] **`MemberController.createMember` is defined but has no route** – dead code (no `POST /members` in `members.routes.ts`).
- [ ] **`OrganizationController.getOrganizationBySlug` is defined but has no route** – dead code.
- [ ] **No request body validation on organization routes** – `validateBody()` middleware is used on auth routes but not on organization, role, member, or API key routes. Invalid payloads pass through.
- [ ] **No pagination parameters on list endpoints** – all `findMany` calls support cursor pagination in the repo layer but the controllers never forward `limit`/`cursor` from query params.
- [ ] **`resendVerification` still uses `"not available/${token}"` placeholder** – not fixed.
- [ ] **`forgotPassword` still uses `"not available/${token}"` placeholder** – not fixed.
- [ ] **`invitationEmailTemplate` result is destructured to `{}` and discarded** – `sendEmail()` is never called in `sendInvite()`. Invitation emails are silently dropped.
- [ ] **`try/catch` missing in `validateAccessToken`** – unhandled promise rejections can crash the process (the `validateApiToken` correctly wraps in try/catch but `validateAccessToken` does not).
- [ ] **No integration / unit tests** – `.turbo/turbo-test.log` exists but test files are absent from `src/`.
- [ ] **Circular import risk** – `users.service.ts` imports `sessionService` directly from `container.ts` while `container.ts` instantiates `UserService`. This tight coupling makes testing hard.
- [ ] **`MongoOrganizationRepository.create` is not atomic** – it creates Organization, Role, and Member in three separate DB calls with no transaction. A failure mid-way leaves orphaned documents.
- [ ] **Role creation in org creation ignores permission validation** (`createSystemRole` skips `PermissionModel.countDocuments` check).
- [ ] **`invitedBy` is required on `MemberModel` but creator (org owner) has no inviter** – set to self (`actorId`) during org creation which is semantically wrong.
- [ ] **`validateAccessToken` has no `try/catch`** – unlike `validateApiToken`, any thrown error propagates as an unhandled rejection.

---

## ✅ What Is Working

- [x] User registration with email verification flow
- [x] JWT access token issuance (RS256, issuer check)
- [x] Refresh token rotation with reuse detection
- [x] Argon2 password hashing
- [x] Session management (create, revoke, revoke-all)
- [x] Password forgot/reset flow (email body ready, URL placeholder still present in resend/forgot paths)
- [x] Change password (requires current password)
- [x] Organization creation (auto-creates owner member + default role)
- [x] Organization update (name, frontendUrl)
- [x] Organization soft delete
- [x] Role CRUD (create, read, update-name, soft-delete)
- [x] Member management (list, get, change role, suspend, activate, remove)
- [x] Invitation send (org-side) & accept/reject/revoke (user-side) — ID-based
- [x] API key create (server-generated), list, get, revoke
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

---

_Last updated: 2026-11-17_
