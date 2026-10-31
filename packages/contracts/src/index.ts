// Common
export { emailSchema, dateSchema } from "./common/schemas/common.schema.js";

export { idSchema } from "./common/schemas/id.schema.js";

// Auth - Schemas
export { passwordSchema, tokenSchema } from "./auth/schemas/auth.schema.js";

export { registerSchema } from "./auth/schemas/register.schema.js";

export { loginSchema } from "./auth/schemas/login.schema.js";

export { verifyEmailSchema } from "./auth/schemas/verify-email.schema.js";

export { forgotPasswordSchema } from "./auth/schemas/forgot-password.schema.js";

export { resetPasswordSchema } from "./auth/schemas/reset-password.schema.js";

// export { sessionParamsSchema, sessionQueryFilterSchema } from "./auth/schemas/session-params.schema.js";
// export type { SessionQueryFilter } from "./auth/schemas/session-params.schema.js";

// Auth - Types
export type {
  Register,
  Login,
  VerifyEmail,
  ForgotPassword,
  ResetPassword,
} from "./auth/types.js";

// Users - Schemas
export { displayNameSchema } from "./users/schemas/user.schema.js";

export { userProfileSchema } from "./users/schemas/user-profile.schema.js";

export { updateUserProfile } from "./users/schemas/update-profile.schema.js";

export {
  changeEmailSchema,
  confirmEmailChangeSchema,
} from "./users/schemas/change-email.schema.js";

export { changePasswordSchema } from "./users/schemas/change-password.schema.js";

export { changeStatusSchema } from "./users/schemas/change-status.schema.js";

export { userParamsSchema } from "./users/schemas/user-params.schema.js";

// Users - Types
export type {
  UserProfile,
  UpdateProfile,
  ChangeEmail,
  ChangePassword,
  ChangeStatus,
  UserParams,
} from "./users/types.js";

export type {
  SendVerificationEmailJob,
  SendPasswordResetEmailJob,
  SendInvitationEmailJob,
} from "./jobs/types.js";

export type { EmailJob } from "./jobs/email.jobs.js";

export {
  sendPasswordRestJobSchema,
  sendVerificationEmailJobSchema,
  sendInvitationEmailJobSchema,
  emailJobSchema,
} from "./jobs/email.jobs.js";

// Invitations - Schemas
export {
  targetTypeSchema,
  sendInvitationSchema,
  invitationParamsSchema,
  organizationInvitationParamsSchema,
} from "./invitation/schemas/invitation.schema.js";

// Invitations - Types
export type {
  TargetType as ContractTargetType,
  SendInvitation,
  InvitationParams,
  OrganizationInvitationParams,
} from "./invitation/types.js";

// Permissions
export { PERMISSIONS, ALL_PERMISSIONS } from "./auth/permissions.js";
export type { Permission } from "./auth/permissions.js";

// Roles - Schemas
export {
  createRoleSchema,
  updateRoleSchema,
  roleParamsSchema,
} from "./roles/schemas/role.schema.js";

// Roles - Types
export type {
  CreateRole,
  UpdateRole,
  RoleParams as ContractRoleParams,
} from "./roles/types.js";

// Audit Log - Schemas & Types
export {
  auditQuerySchema,
  organizationAuditParamsSchema,
} from "./audit/schemas/audit-query.schema.js";
export type {
  AuditQuery,
  OrganizationAuditParams,
} from "./audit/schemas/audit-query.schema.js";
