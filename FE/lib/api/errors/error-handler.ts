import { NextResponse } from "next/server";
import { ApiError } from "../api-error";
import { ErrorCode } from "./error-codes";
import { ErrorMessageMap } from "./error-messages";
import { ErrorStatusMap } from "./error-status";

export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T) => {
    try {
      return await handler(...args)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: err.code,
              status: err.status,
              message: err.message,
              details: err.details 
            }, 
          }, 
          { status: err.status }
        )
      }
      
      if (err instanceof Error) {
        console.error({
          message: err.message,
          stack: err.stack,
        })
      } else {
        console.error("Unknown error: ", err);
      }

      return NextResponse.json(
        {
          success: false, 
          error: {
            code: ErrorCode.UNKNOWN,
            status: ErrorStatusMap[ErrorCode.UNKNOWN],
            message: ErrorMessageMap[ErrorCode.UNKNOWN], 
          },
        }, 
        { status: ErrorStatusMap[ErrorCode.UNKNOWN] }
      )
    }
  };
}
