const DEFAULT_ACCESS_TOKEN_TTL = 60 * 60;
const DEFAULT_REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30;

const parseTokenTtl = (value: string | undefined, fallback: number) => {
  const ttl = Number(value);
  return Number.isFinite(ttl) && ttl > 0 ? Math.floor(ttl) : fallback;
};

export const ACCESS_TOKEN_MAX_AGE = parseTokenTtl(
  process.env.ACCESS_TOKEN_TTL,
  DEFAULT_ACCESS_TOKEN_TTL
);

export const REFRESH_TOKEN_MAX_AGE = parseTokenTtl(
  process.env.REFRESH_TOKEN_TTL,
  DEFAULT_REFRESH_TOKEN_TTL
);
