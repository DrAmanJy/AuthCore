import { Types } from "mongoose";

import { InvalidObjectIdError } from "../errors/invalid-object-id.error.js";

export function toObjectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new InvalidObjectIdError(id);
  }
  return new Types.ObjectId(id);
}
