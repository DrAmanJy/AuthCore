export const SYSTEM_PERMISSIONS = {
  ORG_READ: "org:read",
  ORG_UPDATE: "org:update",
  ORG_DELETE: "org:delete",
  MEMBERS_READ: "members:read",
  MEMBERS_INVITE: "members:invite",
  MEMBERS_UPDATE: "members:update",
  MEMBERS_REMOVE: "members:remove",
  ROLES_READ: "roles:read",
  ROLES_CREATE: "roles:create",
  ROLES_UPDATE: "roles:update",
  ROLES_DELETE: "roles:delete",
  API_KEYS_READ: "api_keys:read",
  API_KEYS_CREATE: "api_keys:create",
  API_KEYS_REVOKE: "api_keys:revoke",
} as const;

export type PermissionKey = (typeof SYSTEM_PERMISSIONS)[keyof typeof SYSTEM_PERMISSIONS];
