import { createUserSchema } from '@/server/features/user/schemas/create-user.schema';
import { registry } from '../../registry';

registry.registerPath({
  method: 'post',
  path: '/api/v1/users',
  tags: ['Users'],
  summary: 'Create user',
  security: [
    {
      bearerAuth: [],
    }
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createUserSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User created',
    },
    400: {
      description: 'Invalid input',
    },
    409: {
      description: 'User already exists'
    },
  },
})