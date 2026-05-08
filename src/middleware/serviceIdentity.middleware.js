import { AppError } from "../utils/AppError.js";

export const extractServiceIdentity = (req, res, next) => {
  const targetAudience = req.headers["x-target-audience"];

  if (!targetAudience) {
    throw new AppError("Bad Request: Missing 'x-target-audience' header", 400);
  }

  req.service = {
    name: targetAudience,
  };

  next();
};
