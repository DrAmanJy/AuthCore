import {
  MongoRefreshTokenRepository,
  MongoSessionRepository,
  MongoUserRepository,
  MongoVerificationTokenRepository,
  MongoApiKeyRepository,
  MongoInvitationRepository,
  MongoMemberRepository,
  MongoOrganizationRepository,
  MongoRoleRepository,
} from "@authcore/database";

import { UserService } from "./modules/users/users.service.js";
import { UserController } from "./modules/users/users.controller.js";
import { AuthController } from "./modules/auth/auth.controller.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { SessionService } from "./modules/auth/session.service.js";
import { PasswordService } from "./modules/auth/password.service.js";
import { RecoveryService } from "./modules/auth/recovery.service.js";
import { emailQueue } from "@authcore/queue";
import { AuthorizationService } from "./modules/organization/authorization/authorization.service.js";
import { OrganizationService } from "./modules/organization/organization.service.js";
import { ApiKeyService } from "./modules/organization/api-keys/api-key.service.js";
import { MembersService } from "./modules/organization/members/member.service.js";
import { RoleService } from "./modules/organization/roles/role.service.js";
import { InvitationService } from "./modules/organization/invitations/invitation.service.js";
import { OrganizationController } from "./modules/organization/organization.controller.js";
import { ApiKeyController } from "./modules/organization/api-keys/api-key.controller.js";
import { InvitationController } from "./modules/organization/invitations/invitation.controller.js";
import { MemberController } from "./modules/organization/members/member.controller.js";
import { RoleController } from "./modules/organization/roles/role.controller.js";

const userRepository = new MongoUserRepository();
const sessionRepository = new MongoSessionRepository();
const refreshTokenRepository = new MongoRefreshTokenRepository();
const verificationTokenRepository = new MongoVerificationTokenRepository();
const organizationRepository = new MongoOrganizationRepository();
const memberRepository = new MongoMemberRepository();
const roleRepository = new MongoRoleRepository();
const apiKeyRepository = new MongoApiKeyRepository();
const invitationRepository = new MongoInvitationRepository();

const userService = new UserService(userRepository);
const sessionService = new SessionService(sessionRepository, refreshTokenRepository);
const passwordService = new PasswordService();
const recoveryService = new RecoveryService(verificationTokenRepository);
const authorizationService = new AuthorizationService(
  organizationRepository,
  apiKeyRepository,
);
const organizationService = new OrganizationService(
  organizationRepository,
  authorizationService,
);
const apiKeyService = new ApiKeyService(apiKeyRepository, authorizationService);
const memberService = new MembersService(memberRepository, authorizationService);
const roleService = new RoleService(roleRepository, authorizationService);
const invitationService = new InvitationService(
  invitationRepository,
  userService,
  memberService,
  authorizationService,
);
const authService = new AuthService(
  userService,
  sessionService,
  passwordService,
  recoveryService,
  emailQueue,
  memberService,
);

const userController = new UserController(userService);
const authController = new AuthController(authService);
const organizationController = new OrganizationController(organizationService);
const apiKeyController = new ApiKeyController(apiKeyService);
const invitationController = new InvitationController(invitationService);
const memberController = new MemberController(memberService);
const roleController = new RoleController(roleService);

export {
  userController,
  authController,
  userService,
  organizationController,
  apiKeyController,
  authorizationService,
  invitationController,
  memberController,
  roleController,
};
