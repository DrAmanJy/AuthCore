import { Types } from "mongoose";
import { InvalidObjectIdError } from "../errors/database.errors.js";

export function toObjectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new InvalidObjectIdError(id);
  }
  return new Types.ObjectId(id);
}
