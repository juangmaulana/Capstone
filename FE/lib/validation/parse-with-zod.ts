import { ZodError, ZodSchema } from "zod";
import { ApiError } from "../errors/api-error";
import { ErrorCodes } from "../errors/error-codes";

export function parseWithZod<T>(schema: ZodSchema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        "Invalid request parameters",
        {
          fieldErrors: err.flatten().fieldErrors,
        }
      );
    }

    throw err;
  }
}