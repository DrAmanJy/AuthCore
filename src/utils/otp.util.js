import crypto from "crypto";
import bcrypt from "bcrypt";
import { env } from "../config/env.js";

export const generateOTP = (length = 6) => {
  const max = Math.pow(10, length);
  const otpNumber = crypto.randomInt(0, max);

  return otpNumber.toString().padStart(length, "0");
};

export const hashOTP = async plainOTP => {
  const hashedOTP = await bcrypt.hash(plainOTP, env.BCRYPT_SALT_ROUNDS);
  return hashedOTP;
};

export const verifyOTP = async (plainOTP, hashedOTP) => {
  const isValid = await bcrypt.compare(plainOTP, hashedOTP);
  return isValid;
};
