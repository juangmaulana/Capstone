import { registry } from '../../registry'
import { paramNumberIdSchema } from '@/lib/validation/param-number-id.schema'

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