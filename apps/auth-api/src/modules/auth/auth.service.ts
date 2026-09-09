import { User } from "@authcore/database";
import { UserService } from "../users/users.service.js";
import type { RegisterType } from "./auth.types.js";
import { PasswordService } from "./password.service.js";

export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
  ) {}

  async registerUser(data: RegisterType): Promise<User> {
    const passwordHash = await this.passwordService.hash(data.password);

    const user = await this.userService.create({
      displayName: data.displayName,
      email: data.email,
      passwordHash,
    });

    //todo push verify_email to SQS

    return user;
  }
  async loginUser() {}
  async logoutUser() {}
  async refreshAccessToken() {}
  async verifyEmail() {}
  async resendVerification() {}
  async forgotPassword() {}
  async resetPassword() {}
  async changePassword() {}
  async getAllSessions() {}
  async deleteSession() {}
  async deleteAllSessions() {}
}
