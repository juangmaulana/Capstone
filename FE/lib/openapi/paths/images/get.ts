import { IdSchema } from '@/server/shared/schemas/id.schema';
import { registry } from '../../registry';

registry.registerPath({
  method: 'get',
  path: 'api/v1/images/{id}',
  tags: ['Images'],
  summary: 'Fetch image',
  request: {
    params: IdSchema,
  },
  responses: {
    200: {
      description: 'Image fetched',
    },
    404: {
      description: 'Image not found',
    }
  }
})