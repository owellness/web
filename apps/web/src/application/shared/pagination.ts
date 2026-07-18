export type Pagination = {
  limit: number;
  cursor?: string | null;
};

export type Paginated<T> = {
  items: T[];
  nextCursor: string | null;
};

export const defaultPagination = (
  partial?: Partial<Pagination>,
): Pagination => ({
  limit: partial?.limit ?? 20,
  cursor: partial?.cursor ?? null,
});
