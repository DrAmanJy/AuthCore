export const PERMISSIONS = {
  ORG_READ: "org:read",
  ORG_UPDATE: "org:update",
  ORG_DELETE: "org:delete",
  ORG_TRANSFER: "org:transfer",

  MEMBERS_READ: "members:read",
  MEMBERS_MANAGE: "members:manage",

  ROLES_READ: "roles:read",
  ROLES_MANAGE: "roles:manage",

  API_KEYS_READ: "api_keys:read",
  API_KEYS_MANAGE: "api_keys:manage",

  INVITATIONS_READ: "invitations:read",
  INVITATIONS_MANAGE: "invitations:manage",

  AUDIT_READ: "audit:read",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);
