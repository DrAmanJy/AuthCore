import { UserService } from "../users/users.service.js";
import type { RegisterType } from "./auth.types.js";

export class AuthService {
  constructor(private readonly userService: UserService) {}
  async registerUser(data: RegisterType) {
    const isEmailExists = await this.userService;
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
