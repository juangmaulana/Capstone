import { registry } from '../../registry'
import { IdSchema } from '@/server/shared/schemas/id.schema';

registry.registerPath({
  method: 'delete',
  path: '/api/v1/users/{id}',
  tags: ['Users'],
  summary: 'Delete user',
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
      description: 'User deleted',
    },
    404: {
      description: 'User not found',
    },
  },
})