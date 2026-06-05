import { RoleFilterSchema } from '@/server/features/role/schemas/filter.schema'
import { registry } from '../../registry'

registry.registerPath({
  method: 'get',
  path: '/api/v1/roles',
  tags: ['Roles'],
  summary: 'Fetch all roles',
  request: {
    query: RoleFilterSchema,
  },
  responses: {
    200: {
      description: 'Roles fetched',
    },
  },
})
