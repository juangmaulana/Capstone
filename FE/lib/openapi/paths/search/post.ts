import { ImageSchema } from "@/server/shared/schemas/image.schema";
import { registry } from "../../registry";

registry.registerPath({
  method: 'post',
  path: '/api/v1/search',
  tags: ['Search'],
  summary: 'Search by image upload',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: ImageSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Seach successful',
    },
    400: {
      description: 'Search failed',
    },
  }
})