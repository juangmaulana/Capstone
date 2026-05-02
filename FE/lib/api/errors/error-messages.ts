import { ErrorCode } from "./error-codes";

export const ErrorMessageMap: Record<ErrorCode, string> = {
  BAD_REQUEST: "Bad Request",
  VALIDATION_ERROR: "Validation Error",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Not Found",
  UNKNOWN: "Internal Server Error",
};