import { IdSchema } from '@/server/shared/schemas/id.schema';
import { updateUserSchema } from '@/server/features/user/schemas/update-user.schema';
import { registry } from '../../registry';

registry.registerPath({
  method: 'patch',
  path: '/api/v1/users/{id}',
  tags: ['Users'],
  summary: 'Update user',
  security: [
    {
      bearerAuth: [],
    }
  ],
  request: {
    params: IdSchema,
    body: {
      content: {
        'application/json': {
          schema: updateUserSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'User updated',
    },
    404: {
      description: 'User not found',
    },
  },
})