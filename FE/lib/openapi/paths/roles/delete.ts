import { paramNumberIdSchema } from '@/lib/validation/param-number-id.schema';
import { registry } from '../../registry';

registry.registerPath({
  method: 'delete',
  path: '/api/roles/{id}',
  tags: ['Roles'],
  summary: 'Delete role',
  request: {
    params: paramNumberIdSchema,
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