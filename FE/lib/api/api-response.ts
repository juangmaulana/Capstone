import { ApiMeta } from "./api-meta";

export type ApiResponse<T> = {
  data: T;
  meta?: ApiMeta;
};