export const ERROR_CODES = {
  // Authentication
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_INVALID_TOKEN: "AUTH_INVALID_TOKEN",
  AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED",
  AUTH_SESSION_EXPIRED: "AUTH_SESSION_EXPIRED",
  AUTH_SESSION_REVOKED: "AUTH_SESSION_REVOKED",
  AUTH_INVALID_REFRESH_TOKEN: "AUTH_INVALID_REFRESH_TOKEN",
  AUTH_SESSION_NOT_FOUND: "AUTH_SESSION_NOT_FOUND",

  // Authorization
  AUTHORIZATION_HEADER_MISSING: "AUTHORIZATION_HEADER_MISSING",
  AUTHORIZATION_HEADER_INVALID: "AUTHORIZATION_HEADER_INVALID",

  // Recovery / Verification
  AUTH_VERIFICATION_TOKEN_INVALID: "AUTH_VERIFICATION_TOKEN_INVALID",
  AUTH_VERIFICATION_TOKEN_EXPIRED: "AUTH_VERIFICATION_TOKEN_EXPIRED",
  AUTH_VERIFICATION_TOKEN_USED: "AUTH_VERIFICATION_TOKEN_USED",
  AUTH_VERIFICATION_TOKEN_NOT_FOUND: "AUTH_VERIFICATION_TOKEN_NOT_FOUND",

  // User
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_EMAIL_ALREADY_EXISTS: "USER_EMAIL_ALREADY_EXISTS",
  USER_EMAIL_NOT_VERIFIED: "USER_EMAIL_NOT_VERIFIED",
  USER_ACCOUNT_DEACTIVATED: "USER_ACCOUNT_DEACTIVATED",
  USER_ACCOUNT_INACTIVE: "USER_ACCOUNT_INACTIVE",
  USER_ACCOUNT_PENDING: "USER_ACCOUNT_PENDING",
  USER_ACCOUNT_SUSPENDED: "USER_ACCOUNT_SUSPENDED",
  USER_PASSWORD_UPDATE_FAILED: "USER_PASSWORD_UPDATE_FAILED",

  // Organization
  ORGANIZATION_NOT_FOUND: "ORGANIZATION_NOT_FOUND",
  ORGANIZATION_INACTIVE: "ORGANIZATION_INACTIVE",
  ORGANIZATION_CREATOR_ONLY: "ORGANIZATION_CREATOR_ONLY",

  // Organization Member
  ORGANIZATION_MEMBER_NOT_FOUND: "ORGANIZATION_MEMBER_NOT_FOUND",
  ORGANIZATION_MEMBER_ALREADY_EXISTS: "ORGANIZATION_MEMBER_ALREADY_EXISTS",
  ORGANIZATION_MEMBER_NOT_ACTIVE: "ORGANIZATION_MEMBER_NOT_ACTIVE",
  ORGANIZATION_MEMBER_NOT_SUSPENDED: "ORGANIZATION_MEMBER_NOT_SUSPENDED",
  ORGANIZATION_MEMBER_REMOVED: "ORGANIZATION_MEMBER_REMOVED",
  ORGANIZATION_MEMBER_ACTIVATION_REQUIRED: "ORGANIZATION_MEMBER_ACTIVATION_REQUIRED",
  ORGANIZATION_MEMBER_SUSPENSION_REQUIRED: "ORGANIZATION_MEMBER_SUSPENSION_REQUIRED",
  ORGANIZATION_MEMBER_REMOVE_DIRECTLY: "ORGANIZATION_MEMBER_REMOVE_DIRECTLY",

  // Role
  ROLE_NOT_FOUND: "ROLE_NOT_FOUND",
  ROLE_ALREADY_EXISTS: "ROLE_ALREADY_EXISTS",
  ROLE_SYSTEM_PROTECTED: "ROLE_SYSTEM_PROTECTED",

  VALIDATION_FAILED: "VALIDATION_FAILED",
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
  AUTH_INVALID_CREDENTIALS: {
    statusCode: 401,
    message: "Invalid email or password.",
  },

  AUTH_INVALID_TOKEN: {
    statusCode: 401,
    message: "The authentication token is invalid.",
  },

  AUTH_TOKEN_EXPIRED: {
    statusCode: 401,
    message: "The authentication token has expired.",
  },

  AUTH_SESSION_EXPIRED: {
    statusCode: 401,
    message: "Your authentication session has expired. Please sign in again.",
  },

  AUTH_SESSION_REVOKED: {
    statusCode: 401,
    message: "Your authentication session is no longer active. Please sign in again.",
  },

  AUTH_INVALID_REFRESH_TOKEN: {
    statusCode: 401,
    message: "The refresh token is invalid or no longer active.",
  },

  AUTH_SESSION_NOT_FOUND: {
    statusCode: 404,
    message: "The requested authentication session could not be found.",
  },

  // Authorization
  AUTHORIZATION_HEADER_MISSING: {
    statusCode: 401,
    message: "Authorization header is required.",
  },

  AUTHORIZATION_HEADER_INVALID: {
    statusCode: 401,
    message: "The authorization header is invalid.",
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
    message: "The verification token has already been used.",
  },

  AUTH_VERIFICATION_TOKEN_NOT_FOUND: {
    statusCode: 404,
    message: "The verification token could not be found.",
  },

  // User
  USER_NOT_FOUND: {
    statusCode: 404,
    message: "The requested user could not be found.",
  },

  USER_EMAIL_ALREADY_EXISTS: {
    statusCode: 409,
    message: "An account with this email address already exists.",
  },

  USER_EMAIL_NOT_VERIFIED: {
    statusCode: 403,
    message: "Your email address must be verified before you can continue.",
  },

  USER_ACCOUNT_DEACTIVATED: {
    statusCode: 403,
    message: "Your account has been deactivated.",
  },

  USER_ACCOUNT_INACTIVE: {
    statusCode: 403,
    message: "Your account is inactive.",
  },

  USER_ACCOUNT_PENDING: {
    statusCode: 403,
    message: "Your account is pending activation.",
  },

  USER_ACCOUNT_SUSPENDED: {
    statusCode: 403,
    message: "Your account has been suspended.",
  },

  USER_PASSWORD_UPDATE_FAILED: {
    statusCode: 500,
    message: "The password could not be updated.",
  },

  // Organization
  ORGANIZATION_NOT_FOUND: {
    statusCode: 404,
    message: "The requested organization could not be found.",
  },

  ORGANIZATION_INACTIVE: {
    statusCode: 403,
    message: "The organization is not active.",
  },

  ORGANIZATION_CREATOR_ONLY: {
    statusCode: 403,
    message: "Only the organization creator can modify this resource.",
  },

  // Organization Member
  ORGANIZATION_MEMBER_NOT_FOUND: {
    statusCode: 404,
    message: "The requested organization member could not be found.",
  },

  ORGANIZATION_MEMBER_ALREADY_EXISTS: {
    statusCode: 409,
    message: "The user is already a member of this organization.",
  },

  ORGANIZATION_MEMBER_NOT_ACTIVE: {
    statusCode: 409,
    message: "Only active members can be modified in this way.",
  },

  ORGANIZATION_MEMBER_NOT_SUSPENDED: {
    statusCode: 409,
    message: "Only suspended members can be activated.",
  },

  ORGANIZATION_MEMBER_REMOVED: {
    statusCode: 409,
    message: "Removed members cannot be updated.",
  },

  ORGANIZATION_MEMBER_ACTIVATION_REQUIRED: {
    statusCode: 409,
    message: "Only suspended members can be activated.",
  },

  ORGANIZATION_MEMBER_SUSPENSION_REQUIRED: {
    statusCode: 409,
    message: "Only active members can be suspended.",
  },

  ORGANIZATION_MEMBER_REMOVE_DIRECTLY: {
    statusCode: 400,
    message: "Use the member removal operation to remove a member.",
  },

  // Role
  ROLE_NOT_FOUND: {
    statusCode: 404,
    message: "The requested role could not be found.",
  },

  ROLE_ALREADY_EXISTS: {
    statusCode: 409,
    message: "A role with this name already exists in the organization.",
  },

  ROLE_SYSTEM_PROTECTED: {
    statusCode: 403,
    message: "System roles cannot be modified.",
  },

  VALIDATION_FAILED: {
    statusCode: 400,
    message: "The request contains invalid data.",
  },

  INTERNAL_SERVER_ERROR: {
    statusCode: 500,
    message: "An unexpected error occurred.",
  },
};
