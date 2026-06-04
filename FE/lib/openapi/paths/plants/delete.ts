import { registry } from '../../registry';
import { IdSchema } from '@/server/shared/schemas/id.schema';

registry.registerPath({
  method: 'delete',
  path: '/api/v1/plants/{id}',
  tags: ['Plants'],
  summary: 'Delete plant',
  security: [
    {
      bearerAuth: [],
    }
  ],
  request: {
    params: IdSchema,
  },
  responses: {
    200: {
      description: 'Plant deleted'
    },
    404: {
      description: 'Plant not found'
    }
  }
})