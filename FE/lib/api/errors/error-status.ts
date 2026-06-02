import { ErrorCode } from "./error-codes";

export const ErrorStatusMap: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUEST: 429,
  UNKNOWN: 500,
};