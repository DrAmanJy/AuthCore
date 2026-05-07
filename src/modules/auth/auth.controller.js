import { env } from "../../config/env.js";
import { getClientInfo } from "../../utils/clientInfo.utils.js";
import * as authService from "./auth.service.js";

export const register = async (req, res) => {
  const user = await authService.registerUser(req.body);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      user,
    },
  });
};

export const login = async (req, res) => {
  const { ipAddress, userAgent, device } = getClientInfo(req);
  const { _id: serviceId, name: serviceName } = req.service;

  const { user, accessToken, refreshToken } = await authService.loginUser({
    ...req.body,
    ipAddress,
    userAgent,
    device,
    serviceId,
    serviceName,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    message: "User logged in successfully",
    data: {
      user,
      accessToken,
    },
  });
};
