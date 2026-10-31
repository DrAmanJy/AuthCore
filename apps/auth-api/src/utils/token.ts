import { AuthenticationError } from "../errors/authentication-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";
import type { AccessTokenPayload } from "../modules/auth/auth.types.js";

export default function getAuthToken(req: {
  token?: AccessTokenPayload;
}): AccessTokenPayload {
  if (!req.token) {
    throw new AuthenticationError(ERROR_CODES.AUTH_UNAUTHORIZED);
  }
  return req.token;
}
