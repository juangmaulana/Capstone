import { IdSchema } from '@/server/shared/schemas/id.schema';
import { registry } from '../../registry';
import { UpdateBoundingBoxSchema } from '@/server/features/identification/schemas/update-bounding-box.schema';

registry.registerPath({
  method: 'patch',
  path: 'api/v1/identifications/{id}',
  tags: ['Identifications'],
  summary: 'Update Bounding Box',
  security: [
    {
      bearerAuth: []
    }
  ],
  request: {
    params: IdSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateBoundingBoxSchema
        }
      }
    },
  },
  responses: {
    200: {
      description: 'Identification image\'s bounding box updated',
    }
  }
})