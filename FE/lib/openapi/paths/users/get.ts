import { registry } from '../../registry'
import { IdSchema } from '@/server/shared/schemas/id.schema';
import { userResponseSchema } from '@/server/features/user/schemas/user-response.schema'
import { UserFilterSchema } from '@/server/features/user/schemas/filter.schema';

registry.registerPath({
  method: 'get',
  path: '/api/v1/users',
  tags: ['Users'],
  summary: 'Fetch all users',
  request: {
    query: UserFilterSchema,
  },
  responses: {
    200: {
      description: 'Users fetched',
    },
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/users/{id}',
  tags: ['Users'],
  summary: 'Fetch user',
  request: {
    params: IdSchema,
  },
  responses: {
    200: {
      description: 'User fetched',
      content: {
        'application/json': {
          schema: userResponseSchema
        },
      },
    },
    404: {
      description: 'User not found',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  status: { type: 'number' },
                  message: { type: 'string' },
                },
              },
            },
          },
          example: {
            success: true,
            error: {
              code: 'NOT_FOUND',
              status: 404,
              message: 'User not found',
            },
          },
        },
      },
    },
  }
})