import type { FindManyOptions, PaginatedResult } from "./repository-pagination.types.js";

export interface ReadRepository<
  TEntity,
  TFindCriteria,
  TFindManyCriteria,
> {
  find(criteria: TFindCriteria): Promise<TEntity | null>;

  findMany(
    criteria: TFindManyCriteria,
    options?: FindManyOptions,
  ): Promise<PaginatedResult<TEntity>>;
}

export interface CreateRepository<TEntity, TCreateData> {
  create(data: TCreateData): Promise<TEntity>;
}

export interface UpdateRepository<
  TEntity,
  TUpdateCriteria,
  TUpdateData,
> {
  update(
    criteria: TUpdateCriteria,
    data: TUpdateData,
  ): Promise<TEntity | null>;
}

export interface SoftDeleteRepository<TEntity, TCriteria> {
  softDelete(criteria: TCriteria): Promise<TEntity | null>;
}

export interface HardDeleteRepository<TCriteria> {
  delete(criteria: TCriteria): Promise<boolean>;
}

export interface StandardRepository<
  TEntity,
  TFindCriteria,
  TFindManyCriteria,
  TCreateData,
  TUpdateCriteria,
  TUpdateData,
> extends
    ReadRepository<TEntity, TFindCriteria, TFindManyCriteria>,
    CreateRepository<TEntity, TCreateData>,
    UpdateRepository<TEntity, TUpdateCriteria, TUpdateData> {}
