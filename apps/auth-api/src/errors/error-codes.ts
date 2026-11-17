export const ERROR_CODES = {
  // Authentication
  AUTH_UNAUTHORIZED: "AUTH_UNAUTHORIZED",
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_INVALID_TOKEN: "AUTH_INVALID_TOKEN",
  AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED",
  AUTH_SESSION_EXPIRED: "AUTH_SESSION_EXPIRED",
  AUTH_SESSION_REVOKED: "AUTH_SESSION_REVOKED",
  AUTH_INVALID_REFRESH_TOKEN: "AUTH_INVALID_REFRESH_TOKEN",
  AUTH_SESSION_NOT_FOUND: "AUTH_SESSION_NOT_FOUND",
  AUTH_REFRESH_TOKEN_REUSE_DETECTED: "AUTH_REFRESH_TOKEN_REUSE_DETECTED",
  AUTH_SESSION_ACCESS_DENIED: "AUTH_SESSION_ACCESS_DENIED",
  AUTH_ONBOARDING_CONTEXT_REQUIRED: "AUTH_ONBOARDING_CONTEXT_REQUIRED",

  // Authorization
  AUTH_HEADER_MISSING: "AUTH_HEADER_MISSING",
  AUTH_HEADER_INVALID: "AUTH_HEADER_INVALID",
  AUTH_VERIFICATION_TOKEN_MISSING: "AUTH_VERIFICATION_TOKEN_MISSING",
  AUTH_EMAIL_MISSING: "AUTH_EMAIL_MISSING",

  // Recovery / Verification
  AUTH_VERIFICATION_TOKEN_INVALID: "AUTH_VERIFICATION_TOKEN_INVALID",
  AUTH_VERIFICATION_TOKEN_EXPIRED: "AUTH_VERIFICATION_TOKEN_EXPIRED",
  AUTH_VERIFICATION_TOKEN_USED: "AUTH_VERIFICATION_TOKEN_USED",
  AUTH_VERIFICATION_TOKEN_NOT_FOUND: "AUTH_VERIFICATION_TOKEN_NOT_FOUND",

  // Authorization & Permissions
  AUTH_FORBIDDEN: "AUTH_FORBIDDEN",
  AUTH_INSUFFICIENT_PERMISSIONS: "AUTH_INSUFFICIENT_PERMISSIONS",
  AUTH_ORGANIZATION_SELECTION_REQUIRED: "AUTH_ORGANIZATION_SELECTION_REQUIRED",
  // User
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_ALREADY_ACTIVE: "USER_ALREADY_ACTIVE",
  USER_EMAIL_ALREADY_EXISTS: "USER_EMAIL_ALREADY_EXISTS",
  USER_EMAIL_NOT_VERIFIED: "USER_EMAIL_NOT_VERIFIED",
  USER_ACCOUNT_DEACTIVATED: "USER_ACCOUNT_DEACTIVATED",
  USER_ACCOUNT_INACTIVE: "USER_ACCOUNT_INACTIVE",
  USER_ACCOUNT_PENDING: "USER_ACCOUNT_PENDING",
  USER_ACCOUNT_SUSPENDED: "USER_ACCOUNT_SUSPENDED",
  USER_PASSWORD_UPDATE_FAILED: "USER_PASSWORD_UPDATE_FAILED",
  USER_EMAIL_CHANGE_TOKEN_INVALID: "USER_EMAIL_CHANGE_TOKEN_INVALID",
  USER_EMAIL_CHANGE_TOKEN_EXPIRED: "USER_EMAIL_CHANGE_TOKEN_EXPIRED",

  // Organization
  ORGANIZATION_NOT_FOUND: "ORGANIZATION_NOT_FOUND",
  ORGANIZATION_INACTIVE: "ORGANIZATION_INACTIVE",
  ORGANIZATION_MEMBER_ACCESS_DENIED: "ORGANIZATION_MEMBER_ACCESS_DENIED",
  ORGANIZATION_ACCESS_DENIED: "ORGANIZATION_ACCESS_DENIED",
  ORGANIZATION_LAST_OWNER_PROTECTION: "ORGANIZATION_LAST_OWNER_PROTECTION",

  // Organization Member
  ORGANIZATION_MEMBER_NOT_FOUND: "ORGANIZATION_MEMBER_NOT_FOUND",
  ORGANIZATION_MEMBER_ALREADY_EXISTS: "ORGANIZATION_MEMBER_ALREADY_EXISTS",
  ORGANIZATION_MEMBER_NOT_ACTIVE: "ORGANIZATION_MEMBER_NOT_ACTIVE",
  ORGANIZATION_MEMBER_NOT_SUSPENDED: "ORGANIZATION_MEMBER_NOT_SUSPENDED",
  ORGANIZATION_MEMBER_REMOVED: "ORGANIZATION_MEMBER_REMOVED",
  ORGANIZATION_MEMBER_SUSPENDED: "ORGANIZATION_MEMBER_SUSPENDED",
  ORGANIZATION_MEMBER_INVITATION_PENDING: "ORGANIZATION_MEMBER_INVITATION_PENDING",

  // Role
  ROLE_NOT_FOUND: "ROLE_NOT_FOUND",
  ROLE_ALREADY_EXISTS: "ROLE_ALREADY_EXISTS",
  ROLE_SYSTEM_PROTECTED: "ROLE_SYSTEM_PROTECTED",

  // API Key
  API_KEY_NOT_FOUND: "API_KEY_NOT_FOUND",
  API_KEY_REVOKED: "API_KEY_REVOKED",
  API_KEY_UNAUTHORIZED: "API_KEY_UNAUTHORIZED",

  // Invitation
  INVITATION_NOT_FOUND: "INVITATION_NOT_FOUND",
  INVITATION_EXPIRED: "INVITATION_EXPIRED",
  INVITATION_ALREADY_ACCEPTED: "INVITATION_ALREADY_ACCEPTED",
  INVITATION_ALREADY_REJECTED: "INVITATION_ALREADY_REJECTED",
  INVITATION_REJECTED: "INVITATION_REJECTED",
  INVITATION_REVOKED: "INVITATION_REVOKED",
  INVITATION_INVALID: "INVITATION_INVALID",

  // Validation & General
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  ROUTE_NOT_FOUND: "ROUTE_NOT_FOUND",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
} as const;
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const ERROR_DEFINITIONS: Record<
  ErrorCode,
  {
    statusCode: number;
    message: string;
  }
> = {
  // Authentication
  AUTH_UNAUTHORIZED: {
    statusCode: 401,
    message: "Authentication required. Please sign in to continue.",
  },

  AUTH_INVALID_CREDENTIALS: {
    statusCode: 401,
    message: "Invalid email or password.",
  },

  AUTH_INVALID_TOKEN: {
    statusCode: 401,
    message: "The access token is invalid or malformed.",
  },

  AUTH_TOKEN_EXPIRED: {
    statusCode: 401,
    message: "The access token has expired. Please refresh your session.",
  },

  AUTH_SESSION_EXPIRED: {
    statusCode: 401,
    message: "Your session has expired. Please sign in again.",
  },

  AUTH_SESSION_REVOKED: {
    statusCode: 401,
    message: "Your session has been terminated. Please sign in again.",
  },

  AUTH_INVALID_REFRESH_TOKEN: {
    statusCode: 401,
    message: "The refresh token is invalid or has already been used.",
  },

  AUTH_SESSION_NOT_FOUND: {
    statusCode: 404,
    message: "Session not found.",
  },

  AUTH_REFRESH_TOKEN_REUSE_DETECTED: {
    statusCode: 401,
    message:
      "Security alert: refresh token reuse detected. All sessions have been revoked.",
  },

  AUTH_SESSION_ACCESS_DENIED: {
    statusCode: 403,
    message: "You are not authorized to manage this session.",
  },
  AUTH_ORGANIZATION_SELECTION_REQUIRED: {
    statusCode: 400,
    message:
      "User belongs to multiple organizations. Please specify an organization to sign in.",
  },

  // Authorization
  AUTH_HEADER_MISSING: {
    statusCode: 401,
    message: "Missing Authorization header. Provide a Bearer token to authenticate.",
  },

  AUTH_HEADER_INVALID: {
    statusCode: 401,
    message: "Invalid Authorization header. Expected format: 'Bearer <token>'.",
  },

  AUTH_VERIFICATION_TOKEN_MISSING: {
    statusCode: 400,
    message: "A verification token is required.",
  },

  AUTH_EMAIL_MISSING: {
    statusCode: 400,
    message: "An email address is required.",
  },

  AUTH_ONBOARDING_CONTEXT_REQUIRED: {
    statusCode: 400,
    message:
      "Please provide an organization name or an invitation token to proceed with registration.",
  },

  // Recovery / Verification
  AUTH_VERIFICATION_TOKEN_INVALID: {
    statusCode: 400,
    message: "The verification token is invalid.",
  },

  AUTH_VERIFICATION_TOKEN_EXPIRED: {
    statusCode: 400,
    message: "The verification token has expired. Please request a new one.",
  },

  AUTH_VERIFICATION_TOKEN_USED: {
    statusCode: 400,
    message: "This verification token has already been used.",
  },

  AUTH_VERIFICATION_TOKEN_NOT_FOUND: {
    statusCode: 404,
    message: "Verification token not found.",
  },

  // Authorization & Permissions
  AUTH_FORBIDDEN: {
    statusCode: 403,
    message: "You do not have permission to perform this action.",
  },

  AUTH_INSUFFICIENT_PERMISSIONS: {
    statusCode: 403,
    message: "You do not have the required permissions for this resource.",
  },

  // User
  USER_NOT_FOUND: {
    statusCode: 404,
    message: "User not found.",
  },

  USER_ALREADY_ACTIVE: {
    statusCode: 409,
    message: "Your account is already active. Verification email cannot be resent.",
  },

  USER_EMAIL_ALREADY_EXISTS: {
    statusCode: 409,
    message: "An account with this email address already exists.",
  },

  USER_EMAIL_NOT_VERIFIED: {
    statusCode: 403,
    message: "Please verify your email address before continuing.",
  },

  USER_ACCOUNT_DEACTIVATED: {
    statusCode: 403,
    message: "Your account has been deactivated. Contact support for assistance.",
  },

  USER_ACCOUNT_INACTIVE: {
    statusCode: 403,
    message: "Your account is inactive. Contact support for assistance.",
  },

  USER_ACCOUNT_PENDING: {
    statusCode: 403,
    message:
      "Your email address is not verified. Check your inbox and verify your email to continue.",
  },

  USER_ACCOUNT_SUSPENDED: {
    statusCode: 403,
    message: "Your account has been suspended. Contact support for assistance.",
  },

  USER_PASSWORD_UPDATE_FAILED: {
    statusCode: 500,
    message: "Failed to update password. Please try again.",
  },

  USER_EMAIL_CHANGE_TOKEN_INVALID: {
    statusCode: 400,
    message: "The email change token is invalid.",
  },

  USER_EMAIL_CHANGE_TOKEN_EXPIRED: {
    statusCode: 400,
    message: "The email change token has expired. Please request a new one.",
  },

  // Organization
  ORGANIZATION_NOT_FOUND: {
    statusCode: 404,
    message: "Organization not found.",
  },

  ORGANIZATION_INACTIVE: {
    statusCode: 403,
    message: "This organization is currently inactive.",
  },

  ORGANIZATION_MEMBER_ACCESS_DENIED: {
    statusCode: 403,
    message: "You do not have access to this organization.",
  },

  ORGANIZATION_ACCESS_DENIED: {
    statusCode: 403,
    message: "Access to this organization is denied.",
  },

  ORGANIZATION_LAST_OWNER_PROTECTION: {
    statusCode: 409,
    message: "Cannot remove, suspend, or demote the last owner of an organization.",
  },

  // Organization Member
  ORGANIZATION_MEMBER_NOT_FOUND: {
    statusCode: 404,
    message: "Organization member not found.",
  },

  ORGANIZATION_MEMBER_ALREADY_EXISTS: {
    statusCode: 409,
    message: "This user is already a member of the organization.",
  },

  ORGANIZATION_MEMBER_NOT_ACTIVE: {
    statusCode: 409,
    message: "This action requires the member to have an active status.",
  },

  ORGANIZATION_MEMBER_NOT_SUSPENDED: {
    statusCode: 409,
    message: "Only suspended members can be reactivated.",
  },

  ORGANIZATION_MEMBER_REMOVED: {
    statusCode: 409,
    message:
      "Your membership in this organization has been removed. Contact an admin for access.",
  },

  ORGANIZATION_MEMBER_SUSPENDED: {
    statusCode: 409,
    message: "Your membership in this organization has been suspended. Contact an admin.",
  },

  ORGANIZATION_MEMBER_INVITATION_PENDING: {
    statusCode: 403,
    message:
      "Your invitation is still pending. Please accept the invitation to access this organization.",
  },

  // Role
  ROLE_NOT_FOUND: {
    statusCode: 404,
    message: "Role not found.",
  },

  ROLE_ALREADY_EXISTS: {
    statusCode: 409,
    message: "A role with this name already exists in the organization.",
  },

  ROLE_SYSTEM_PROTECTED: {
    statusCode: 403,
    message: "System roles cannot be modified or deleted.",
  },

  // API Key
  API_KEY_NOT_FOUND: {
    statusCode: 404,
    message: "API key not found.",
  },

  API_KEY_REVOKED: {
    statusCode: 403,
    message: "This API key has been revoked.",
  },

  API_KEY_UNAUTHORIZED: {
    statusCode: 403,
    message: "This API key does not belong to the requested organization.",
  },

  // Invitation
  INVITATION_NOT_FOUND: {
    statusCode: 404,
    message: "Invitation not found.",
  },

  INVITATION_EXPIRED: {
    statusCode: 410,
    message: "This invitation has expired. Please request a new invitation.",
  },

  INVITATION_ALREADY_ACCEPTED: {
    statusCode: 409,
    message: "This invitation has already been accepted.",
  },

  INVITATION_ALREADY_REJECTED: {
    statusCode: 409,
    message: "This invitation has already been rejected.",
  },
  INVITATION_REJECTED: {
    statusCode: 409,
    message: "This invitation has been rejected.",
  },

  INVITATION_REVOKED: {
    statusCode: 410,
    message: "This invitation has been revoked.",
  },
  INVITATION_INVALID: {
    statusCode: 400,
    message: "This invitation is invalid.",
  },

  // Validation & General
  RATE_LIMIT_EXCEEDED: {
    statusCode: 429,
    message: "Too many requests. Please slow down and try again later.",
  },

  VALIDATION_FAILED: {
    statusCode: 400,
    message: "The request data is invalid.",
  },

  ROUTE_NOT_FOUND: {
    statusCode: 404,
    message: "The requested endpoint does not exist.",
  },

  INTERNAL_SERVER_ERROR: {
    statusCode: 500,
    message: "An unexpected error occurred. Please try again later.",
  },
};
