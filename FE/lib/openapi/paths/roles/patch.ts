import { paramNumberIdSchema } from '@/lib/validation/param-number-id.schema';
import { registry } from '../../registry';
import { updateRoleSchema } from '@/server/features/role/schemas/update-role.schema';

registry.registerPath({
  method: 'patch',
  path: '/api/roles/{id}',
  tags: ['Roles'],
  summary: 'Update role',
  request: {
    params: paramNumberIdSchema,
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