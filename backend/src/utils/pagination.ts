export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

interface PaginationOptions {
  defaultPage?: number;
  defaultLimit?: number;
  maxLimit?: number;
}

const toInt = (raw: unknown, fallback: number): number => {
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const parsePagination = (
  query: Record<string, unknown>,
  options: PaginationOptions = {}
): PaginationParams => {
  const defaultPage = options.defaultPage ?? 1;
  const defaultLimit = options.defaultLimit ?? 25;
  const maxLimit = options.maxLimit ?? 200;

  const page = Math.max(1, toInt(query.page, defaultPage));
  const requestedLimit = Math.max(1, toInt(query.limit, defaultLimit));
  const limit = Math.min(requestedLimit, maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const buildPaginationMeta = (page: number, limit: number, total: number) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};

