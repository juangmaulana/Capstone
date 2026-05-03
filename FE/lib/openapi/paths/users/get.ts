import { registry } from '../../registry'
import { paramNumberIdSchema } from '@/lib/validation/param-number-id.schema'
import { listUsersSchema } from '@/server/features/user/schemas/list-users.schema'
import { userResponseSchema } from '@/server/features/user/schemas/user-response.schema'

registry.registerPath({
  method: 'get',
  path: '/api/users',
  tags: ['Users'],
  summary: 'Fetch all users',
  request: {
    query: listUsersSchema,
  },
  responses: {
    200: {
      description: 'Users fetched',
    },
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/users/{id}',
  tags: ['Users'],
  summary: 'Fetch user',
  request: {
    params: paramNumberIdSchema,
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