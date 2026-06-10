import { UpdateValidationSchema } from '@/server/features/identification/schemas/update-validation.schema';
import { registry } from '../../registry';
import { IdSchema } from '@/server/shared/schemas/id.schema';

registry.registerPath({
  method: 'post',
  path: 'api/v1/identifications/{id}/validate',
  tags: ['Identifications'],
  summary: 'Validate Identification',
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
          schema: UpdateValidationSchema
        }
      }
    },
  },
  responses: {
    200: {
      description: 'Identification validated',
    }
  }
})