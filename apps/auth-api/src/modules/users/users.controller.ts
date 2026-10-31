import type { Request, Response } from "express";

import { asUserId } from "@authcore/database";

import type { ChangeStatus, UpdateProfile } from "@authcore/contracts";

import type { UserService } from "./users.service.js";
import { AuthenticationError } from "../../errors/authentication-error.js";
import { ERROR_CODES } from "../../errors/error-codes.js";
import { sendSuccess } from "../../utils/response.utils.js";
import type { AccessTokenPayload } from "../auth/auth.types.js";

type UserParams = {
  userId: string;
};

type UserRequest<TBody = unknown> = Request<UserParams, unknown, TBody>;

export class UserController {
  constructor(private readonly userService: UserService) {
    this.getUserById = this.getUserById.bind(this);
    this.getAuthenticatedUser = this.getAuthenticatedUser.bind(this);
    this.updateUserProfile = this.updateUserProfile.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
    this.getAllUsers = this.getAllUsers.bind(this);
    this.changeUserStatus = this.changeUserStatus.bind(this);
    this.deactivateUser = this.deactivateUser.bind(this);
  }

  async getUserById(req: UserRequest, res: Response) {
    const user = await this.userService.getUserById(asUserId(req.params.userId));

    sendSuccess(res, user, "User successfully retrieved");
  }

  async getAuthenticatedUser(req: Request, res: Response) {
    const { sub } = this.getAuthToken(req);

    const user = await this.userService.getUserById(sub);
    sendSuccess(res, user, "Authenticated user successfully retrieved");
  }

  async updateUserProfile(req: UserRequest<UpdateProfile>, res: Response) {
    const { sub } = this.getAuthToken(req);

    const user = await this.userService.updateProfile(sub, {
      displayName: req.body.displayName,
    });
    sendSuccess(res, user, "User profile successfully updated");
  }

  async deleteUser(req: UserRequest, res: Response) {
    const { sub } = this.getAuthToken(req);

    const user = await this.userService.deleteUser(sub);

    sendSuccess(res, user, "User successfully deleted");
  }

  async getAllUsers(_req: Request, res: Response) {
    const users = await this.userService.getAllUsers();
    sendSuccess(res, users, "Users successfully retrieved");
  }

  async changeUserStatus(req: UserRequest<ChangeStatus>, res: Response) {
    const user = await this.userService.changeStatus(asUserId(req.params.userId), {
      status: req.body.status,
    });
    sendSuccess(res, user, "User status successfully updated");
  }

  async deactivateUser(req: UserRequest, res: Response) {
    const { sub } = this.getAuthToken(req);
    const user = await this.userService.deactivateUser(sub);
    sendSuccess(res, user, "User successfully deactivated");
  }

  private getAuthToken(req: { token?: AccessTokenPayload }): AccessTokenPayload {
    if (!req.token) {
      throw new AuthenticationError(ERROR_CODES.AUTH_UNAUTHORIZED);
    }
    return req.token;
  }
}
