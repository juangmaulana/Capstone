import { listRolesSchema } from '@/server/features/role/schemas/list-roles.schema'
import { registry } from '../registry'
import { paramNumberIdSchema } from '@/lib/validation/param-number-id.schema'
import { createRoleSchema } from '@/server/features/role/schemas/create-role.schema'
import { updateRoleSchema } from '@/server/features/role/schemas/update-role.schema'

// GET /api/roles
registry.registerPath({
  method: 'get',
  path: '/api/roles',
  tags: ['Roles'],
  summary: 'Fetch all roles',
  request: {
    query: listRolesSchema,
  },
  responses: {
    200: {
      description: 'Roles fetched',
    },
  },
})

// POST /api/roles
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

// GET /api/roles/{id}
registry.registerPath({
  method: 'get',
  path: '/api/roles/{id}',
  tags: ['Roles'],
  summary: 'Fetch role',
  request: {
    params: paramNumberIdSchema,
  },
  responses: {
    200: {
      description: 'Role fetched',
    },
    404: {
      description: 'Role not found',
    },
  }
})

// PATCH /api/roles/{id}
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

// DELETE /api/roles/{id}
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