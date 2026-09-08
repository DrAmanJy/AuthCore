export class InvalidObjectIdError extends Error {
  constructor(id: string) {
    super(`Invalid ObjectId: ${id}`);
    this.name = "InvalidObjectIdError";
  }
}