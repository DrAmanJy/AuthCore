import type { Request, Response } from "express";

import { asUserId } from "@authcore/database";

import type { ChangeEmail, ChangeStatus, UpdateProfile } from "@authcore/contracts";

import type { UserService } from "./users.service.js";
import { sendSuccess } from "../../utils/response.utils.js";

type UserParams = {
  userId: string;
};

type UserRequest<TBody = unknown> = Request<UserParams, unknown, TBody>;

export class UserController {
  constructor(private readonly userService: UserService) {
    this.getUserById = this.getUserById.bind(this);
    this.getAuthenticatedUser = this.getAuthenticatedUser.bind(this);
    this.updateUserProfile = this.updateUserProfile.bind(this);
    this.updateUserEmail = this.updateUserEmail.bind(this);
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
    const { userId } = req.user;

    const user = await this.userService.getUserById(asUserId(userId));
    sendSuccess(res, user, "Authenticated user successfully retrieved");
  }

  async updateUserProfile(req: UserRequest<UpdateProfile>, res: Response) {
    const user = await this.userService.updateProfile(asUserId(req.params.userId), {
      displayName: req.body.displayName,
    });
    sendSuccess(res, user, "User profile successfully updated");
  }

  async updateUserEmail(req: UserRequest<ChangeEmail>, res: Response) {
    const user = await this.userService.changeEmail(asUserId(req.params.userId), {
      email: req.body.email,
    });

    sendSuccess(res, user, "User email successfully updated");
  }

  async deleteUser(req: UserRequest, res: Response) {
    const user = await this.userService.deleteUser(asUserId(req.params.userId));

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
    const user = await this.userService.deactivateUser(asUserId(req.params.userId));
    sendSuccess(res, user, "User successfully deactivated");
  }
}
