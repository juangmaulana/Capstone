import { UpdatePlantSchema } from '@/server/features/plant/schemas/update.schema';
import { registry } from '../../registry';
import { IdSchema } from '@/server/shared/schemas/id.schema';

registry.registerPath({
  method: 'patch',
  path: '/api/v1/plants/{id}',
  tags: ['Plants'],
  summary: 'Update plant',
  request: {
    params: IdSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdatePlantSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Plant updated'
    },
    400: {
      description: 'Invalid request'
    },
    404: {
      description: 'Plant not found'
    },
  }
})