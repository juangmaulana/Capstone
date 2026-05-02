import { ErrorCode } from "@/lib/api/errors/error-codes";
import { ErrorMessageMap } from "@/lib/api/errors/error-messages";
import { ErrorStatusMap } from "@/lib/api/errors/error-status";

export class ApiError extends Error {
  code: ErrorCode;
  status: number;
  details?: unknown;

  constructor(code: ErrorCode, message?: string, details?: unknown) {
    const finalMessage = message ?? ErrorMessageMap[code];
    super(finalMessage);

    this.name = "ApiError";
    this.code = code;
    this.status = ErrorStatusMap[code];
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      details: this.details,
    };
  }
}