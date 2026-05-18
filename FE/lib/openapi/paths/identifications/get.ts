import { IdentificationFilterSchema } from '@/server/features/identification/schemas/filter.schema';
import { registry } from '../../registry';
import { IdSchema } from '@/server/shared/schemas/id.schema';

registry.registerPath({
  method: 'get',
  path: 'api/v1/identifications',
  tags: ['Identifications'],
  summary: 'Fetch all identifications',
  request: {
    query: IdentificationFilterSchema,
  },
  responses: {
    200: {
      description: 'Identifications fetched',
    }
  }
})

registry.registerPath({
  method: 'get',
  path: 'api/v1/identifications/{id}',
  tags: ['Identifications'],
  summary: 'Fetch identification',
  request: {
    params: IdSchema,
  },
  responses: {
    200: {
      description: 'Identification fetched',
    },
    404: {
      description: 'Identification not found',
    }
  }
})