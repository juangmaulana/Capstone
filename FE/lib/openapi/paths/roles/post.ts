import { createRoleSchema } from '@/server/features/role/schemas/create-role.schema';
import { registry } from '../../registry';

registry.registerPath({
  method: 'post',
  path: '/api/roles',
  tags: ['Roles'],
  summary: 'Create role',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createRoleSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Role created',
    },
    400: {
      description: 'Invalid input',
    },
  },
})