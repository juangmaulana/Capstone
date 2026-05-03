import { registry } from '../../registry';
import { IdSchema } from '@/server/shared/schemas/id.schema';

registry.registerPath({
  method: 'delete',
  path: '/api/plants/{id}',
  tags: ['Plants'],
  summary: 'Delete plant',
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