import { IdSchema } from '@/server/shared/schemas/id.schema';
import { registry } from '../../registry';
import { updateRoleSchema } from '@/server/features/role/schemas/update-role.schema';

registry.registerPath({
  method: 'patch',
  path: '/api/v1/roles/{id}',
  tags: ['Roles'],
  summary: 'Update role',
  request: {
    params: IdSchema,
    body: {
      content: {
        'application/json': {
          schema: updateRoleSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Role updated',
    },
    404: {
      description: 'Role not found',
    },
  },
})