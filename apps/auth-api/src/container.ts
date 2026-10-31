import {
  MongoRefreshTokenRepository,
  MongoSessionRepository,
  MongoUserRepository,
  MongoVerificationTokenRepository,
} from "@authcore/database";

import { UserService } from "./modules/users/users.service.js";
import { UserController } from "./modules/users/users.controller.js";
import { AuthController } from "./modules/auth/auth.controller.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { SessionService } from "./modules/auth/session.service.js";
import { PasswordService } from "./modules/auth/password.service.js";
import { RecoveryService } from "./modules/auth/recovery.service.js";
import { emailQueue } from "@authcore/queue";
import { memberService } from "./modules/organization/organization.container.js";

const userRepository = new MongoUserRepository();
const sessionRepository = new MongoSessionRepository();
const refreshTokenRepository = new MongoRefreshTokenRepository();
const verificationTokenRepository = new MongoVerificationTokenRepository();

const userService = new UserService(userRepository);
const sessionService = new SessionService(sessionRepository, refreshTokenRepository);
const passwordService = new PasswordService();
const recoveryService = new RecoveryService(verificationTokenRepository);

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

export { userController, authController, userService };
