import * as userService from "./user.service.js";

export const getMe = async (req, res) => {

  const { sub: userId } = req.accessToken;

  const user = await userService.getUserProfile(userId);

  res.status(200).json({
    success: true,
    data: { user },
  });
};

export const updateMe = async (req, res) => {

  const { sub: userId } = req.accessToken;

  const updatedUser = await userService.updateUserProfile(userId, req.body);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: { user: updatedUser },
  });
};

export const deactivateMe = async (req, res) => {

  const { sub: userId } = req.accessToken;

  await userService.deactivateUserProfile(userId);

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({
    success: true,
    message: "Your account has been successfully deactivated.",
  });
};
