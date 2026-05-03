import { ApiError } from '../api-error';
import { ErrorCode, ErrorMessageMap } from './error-codes';

export const notFound = (message = ErrorMessageMap[ErrorCode.NOT_FOUND]) =>
  new ApiError(ErrorCode.NOT_FOUND, message);

export const badRequest = (message = ErrorMessageMap[ErrorCode.BAD_REQUEST]) =>
  new ApiError(ErrorCode.BAD_REQUEST, message);

export const unauthorized = (message = ErrorMessageMap[ErrorCode.UNAUTHORIZED]) =>
  new ApiError(ErrorCode.UNAUTHORIZED, message);

export const forbidden = (message = ErrorMessageMap[ErrorCode.FORBIDDEN]) =>
  new ApiError(ErrorCode.FORBIDDEN, message);