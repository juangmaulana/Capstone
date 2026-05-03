import { registry } from '../../registry';
import { CreatePlantSchema } from '@/server/features/plant/schemas/create.schema';

registry.registerPath({
  method: 'post',
  path: '/api/v1/plants',
  tags: ['Plants'],
  summary: 'Create plant',
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreatePlantSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Plant created'
    },
    400: {
      description: 'Invalid request'
    }
  }
})