import { IdSchema } from '@/server/shared/schemas/id.schema';
import { registry } from '../../registry';

registry.registerPath({
  method: 'delete',
  path: 'api/v1/identifications/{id}',
  tags: ['Identifications'],
  summary: 'Delete identification',
  security: [
    {
      bearerAuth: []
    }
  ],
  request: {
    params: IdSchema,
  },
  responses: {
    200: {
      description: 'Identification deleted updated',
    }
  }
})