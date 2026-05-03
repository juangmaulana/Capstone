import { PlantFilterSchema } from '@/server/features/plant/schemas/filter.schema';
import { registry } from '../../registry';
import { IdSchema } from '@/server/shared/schemas/id.schema';

registry.registerPath({
  method: 'get',
  path: '/api/v1/plants',
  tags: ['Plants'],
  summary: 'Fetch all plants',
  request: {
    query: PlantFilterSchema,
  },
  responses: {
    200: {
      description: 'Plants fetched'
    }
  }
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/plants/{id}',
  tags: ['Plants'],
  summary: 'Fetch plant',
  request: {
    params: IdSchema,
  },
  responses: {
    200: {
      description: 'Plant fetched'
    },
    404: {
      description: 'Plant not found'
    }
  }
})