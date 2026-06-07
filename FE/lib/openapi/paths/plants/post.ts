import { ImageSchema } from '@/server/shared/schemas/image.schema';
import { registry } from '../../registry';
import { CreatePlantWithFileSchema } from '@/server/features/plant/schemas/create.schema';

registry.registerPath({
  method: 'post',
  path: '/api/v1/plants',
  tags: ['Plants'],
  summary: 'Create plant',
  security: [
    {
      bearerAuth: [],
    }
  ],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: CreatePlantWithFileSchema,
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

registry.registerPath({
  method: 'post',
  path: '/api/v1/plants/detect',
  tags: ['Plants'],
  summary: 'Detect plant',
  description: 'Detecting plant from an image',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: ImageSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Plants detected',
    },
    400: {
      description: 'Detection failed',
    },
  }
})