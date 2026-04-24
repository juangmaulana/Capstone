import { NextResponse } from "next/server";
import { ApiError } from "./api-error";
import { ErrorCodes } from "./error-codes";
import { ErrorMessageMap } from "./error-messages";
import { ErrorStatusMap } from "./error-status";

export function withErrorHandling(handler: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        return NextResponse.json(
          { error: err.message, code: err.code, details: err.details }, 
          { status: err.status });
      }
      
      if (err instanceof Error) {
        console.error(err.message, err.stack);
      } else {
        console.error("Unknown error:", err);
      }

      return NextResponse.json(
        { error: ErrorMessageMap[ErrorCodes.UNKNOWN], code: ErrorCodes.UNKNOWN }, 
        { status: ErrorStatusMap[ErrorCodes.UNKNOWN] });
    }
  };
}