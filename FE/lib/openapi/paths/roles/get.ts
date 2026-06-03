import { listRolesSchema } from '@/server/features/role/schemas/list-roles.schema'
import { registry } from '../../registry'

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
