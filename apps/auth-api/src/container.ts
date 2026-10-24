import {
  MongoApiKeyRepository,
  MongoInvitationRepository,
  MongoOrganizationMemberRepository,
  MongoOrganizationRepository,
  MongoRefreshTokenRepository,
  MongoRoleRepository,
  MongoSessionRepository,
  MongoUserRepository,
  MongoVerificationTokenRepository,
  MongoAuditLogRepository,
} from "@authcore/database";

import { UserService } from "./modules/users/users.service.js";
import { UserController } from "./modules/users/users.controller.js";
import { AuthController } from "./modules/auth/auth.controller.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { SessionService } from "./modules/auth/session.service.js";
import { PasswordService } from "./modules/auth/password.service.js";
import { RecoveryService } from "./modules/auth/recovery.service.js";
import { OrganizationController } from "./modules/organization/organization.controller.js";
import { OrganizationService } from "./modules/organization/organization.service.js";
import { emailQueue } from "@authcore/queue";
import { ApiKeyService } from "./modules/api-keys/api-key.service.js";
import { InvitationController } from "./modules/invitation/invitation.controller.js";
import { InvitationService } from "./modules/invitation/invitation.service.js";
import { AuditService } from "./modules/audit/audit.service.js";
import { AuditController } from "./modules/audit/audit.controller.js";

const userRepository = new MongoUserRepository();
const sessionRepository = new MongoSessionRepository();
const refreshTokenRepository = new MongoRefreshTokenRepository();
const verificationTokenRepository = new MongoVerificationTokenRepository();
const organizationRepository = new MongoOrganizationRepository();
const organizationMemberRepository = new MongoOrganizationMemberRepository();
const roleRepository = new MongoRoleRepository();
const apiKeyRepository = new MongoApiKeyRepository();
const invitationRepository = new MongoInvitationRepository();
const auditLogRepository = new MongoAuditLogRepository();

const userService = new UserService(userRepository);
const sessionService = new SessionService(sessionRepository, refreshTokenRepository);
const passwordService = new PasswordService();
const recoveryService = new RecoveryService(verificationTokenRepository);
const apiKeyService = new ApiKeyService(apiKeyRepository);
const organizationService = new OrganizationService(
  organizationRepository,
  organizationMemberRepository,
  roleRepository,
  apiKeyService,
);
const authService = new AuthService(
  userService,
  sessionService,
  passwordService,
  recoveryService,
  emailQueue,
  organizationService,
);
const auditService = new AuditService(auditLogRepository);
const invitationService = new InvitationService(
  invitationRepository,
  userService,
  organizationService,
);

const userController = new UserController(userService);
const authController = new AuthController(authService);
const organizationController = new OrganizationController(organizationService);
const invitationController = new InvitationController(invitationService);
const auditController = new AuditController(auditService);

export {
  userController,
  authController,
  organizationController,
  apiKeyService,
  invitationController,
  auditService,
  auditController,
};
