import { UpdatePlantWithFileSchema } from '@/server/features/plant/schemas/update.schema';
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
        "multipart/form-data": {
          schema: UpdatePlantWithFileSchema,
        },
      },
    },
  },
  responses: {
    200: {
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