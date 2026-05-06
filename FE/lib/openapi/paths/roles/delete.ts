import { IdSchema } from '@/server/shared/schemas/id.schema';
import { registry } from '../../registry';

registry.registerPath({
  method: 'delete',
  path: '/api/v1/roles/{id}',
  tags: ['Roles'],
  summary: 'Delete role',
  request: {
    params: IdSchema,
  },
  responses: {
    200: {
      description: 'Role deleted',
    },
    404: {
      description: 'Role not found',
    },
  },
})