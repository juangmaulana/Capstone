import { registry } from '../registry'
import { paramNumberIdSchema } from '@/lib/validation/param-number-id.schema'
import { createUserSchema } from '@/server/features/user/schemas/create-user.schema'
import { listUsersSchema } from '@/server/features/user/schemas/list-users.schema'
import { updateUserSchema } from '@/server/features/user/schemas/update-user.schema'
import { userResponseSchema } from '@/server/features/user/schemas/user-response.schema'

// GET /api/users
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

// POST /api/users
registry.registerPath({
  method: 'post',
  path: '/api/users',
  tags: ['Users'],
  summary: 'Create user',
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

// GET /api/users/{id}
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

// PATCH /api/users/{id}
registry.registerPath({
  method: 'patch',
  path: '/api/users/{id}',
  tags: ['Users'],
  summary: 'Update user',
  request: {
    params: paramNumberIdSchema,
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

// DELETE /api/users/{id}
registry.registerPath({
  method: 'delete',
  path: '/api/users/{id}',
  tags: ['Users'],
  summary: 'Delete user',
  request: {
    params: paramNumberIdSchema,
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