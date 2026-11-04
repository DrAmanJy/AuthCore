import type { ActorId } from "./user/user.types.js";

export interface RepositoryContext {
  actorId?: ActorId;
}

export interface MutationContext extends RepositoryContext {
  actorId: ActorId;
}
