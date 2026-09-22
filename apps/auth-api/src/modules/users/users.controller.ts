import type { Request, Response } from "express";

import { asUserId } from "@authcore/database";

import type { ChangeEmail, ChangeStatus, UpdateProfile } from "@authcore/contracts";

import type { UserService } from "./users.service.js";

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

    return res.status(200).json({
      message: "User retrieved successfully",
      data: {
        user,
      },
    });
  }

  async getAuthenticatedUser(req: Request, res: Response) {
    const { userId } = req.user;

    const user = await this.userService.getUserById(asUserId(userId));

    return res.status(200).json({
      message: "Authenticated user retrieved successfully",
      data: {
        user,
      },
    });
  }

  async updateUserProfile(req: UserRequest<UpdateProfile>, res: Response) {
    const user = await this.userService.updateProfile(asUserId(req.params.userId), {
      displayName: req.body.displayName,
    });

    return res.status(200).json({
      message: "User profile updated successfully",
      data: {
        user,
      },
    });
  }

  async updateUserEmail(req: UserRequest<ChangeEmail>, res: Response) {
    const user = await this.userService.changeEmail(asUserId(req.params.userId), {
      email: req.body.email,
    });

    return res.status(200).json({
      message: "User email updated successfully",
      data: {
        user,
      },
    });
  }

  async deleteUser(req: UserRequest, res: Response) {
    await this.userService.deleteUser(asUserId(req.params.userId));

    return res.status(200).json({
      message: "User deleted successfully",
    });
  }

  async getAllUsers(_req: Request, res: Response) {
    const users = await this.userService.getAllUsers();

    return res.status(200).json({
      message: "Users retrieved successfully",
      data: {
        users,
      },
    });
  }

  async changeUserStatus(req: UserRequest<ChangeStatus>, res: Response) {
    const user = await this.userService.changeStatus(asUserId(req.params.userId), {
      status: req.body.status,
    });

    return res.status(200).json({
      message: "User status updated successfully",
      data: {
        user,
      },
    });
  }

  async deactivateUser(req: UserRequest, res: Response) {
    const user = await this.userService.deactivateUser(asUserId(req.params.userId));

    return res.status(200).json({
      message: "User status deactivated successfully",
      data: {
        user,
      },
    });
  }
}
