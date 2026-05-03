import { listRolesSchema } from '@/server/features/role/schemas/list-roles.schema'
import { registry } from '../../registry'
import { paramNumberIdSchema } from '@/lib/validation/param-number-id.schema'

registry.registerPath({
  method: 'get',
  path: '/api/v1/roles',
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

registry.registerPath({
  method: 'get',
  path: '/api/v1/roles/{id}',
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
