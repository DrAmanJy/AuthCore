import bcrypt from "bcrypt";

import Users from "../users/user.model.js";

import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";

export const registerUser = async ({ name, email, password }) => {
  const existingUser = await Users.exists({ email });

  if (existingUser) {
    throw new AppError("User with this email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

  const user = await Users.create({
    name,
    email,
    password: hashedPassword,
  });

  return user;
};
