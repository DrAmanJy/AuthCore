import {
  MongoOrganizationMemberRepository,
  MongoOrganizationRepository,
  MongoRefreshTokenRepository,
  MongoRoleRepository,
  MongoSessionRepository,
  MongoUserRepository,
  MongoVerificationTokenRepository,
} from "@authcore/database";

import { UserService } from "../src/modules/users/users.service.js";
import { UserController } from "../src/modules/users/users.controller.js";
import { AuthController } from "./modules/auth/auth.controller.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { SessionService } from "./modules/auth/session.service.js";
import { PasswordService } from "./modules/auth/password.service.js";
import { RecoveryService } from "./modules/auth/recovery.service.js";
import { OrganizationController } from "./modules/organization/organization.controller.js";
import { OrganizationService } from "./modules/organization/organization.service.js";

const userRepository = new MongoUserRepository();
const sessionRepository = new MongoSessionRepository();
const refreshTokenRepository = new MongoRefreshTokenRepository();
const verificationTokenRepository = new MongoVerificationTokenRepository();
const organizationRepository = new MongoOrganizationRepository();
const organizationMemberRepository = new MongoOrganizationMemberRepository();
const roleRepository = new MongoRoleRepository();

const userService = new UserService(userRepository);
const sessionService = new SessionService(sessionRepository, refreshTokenRepository);
const passwordService = new PasswordService();
const recoveryService = new RecoveryService(verificationTokenRepository);
const authService = new AuthService(
  userService,
  sessionService,
  passwordService,
  recoveryService,
);
const organizationService = new OrganizationService(
  organizationRepository,
  organizationMemberRepository,
  roleRepository,
);

const userController = new UserController(userService);
const authController = new AuthController(authService);
const organizationController = new OrganizationController(organizationService);

export { userController, authController, organizationController };
