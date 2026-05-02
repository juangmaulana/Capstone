import { ZodError, ZodType } from "zod";
import { ApiError } from "../api/api-error";
import { ErrorCode } from "../api/errors/error-codes";

export function parseWithZod<T>(
  schema: ZodType<T>, 
  input: unknown
): T {
  try {
    return schema.parse(input);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        "Invalid request parameters",
        {
          fieldErrors: err.flatten().fieldErrors,
        }
      );
    }

    throw err;
  }
}