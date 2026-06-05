import { registry } from '../../registry';

registry.registerPath({
  method: 'get',
  path: '/api/v1/auth/profile',
  tags: ['Auth'],
  summary: 'Profile',
  security: [
    {
      bearerAuth: [],
    }
  ],
  responses: {
    200: {
      description: 'Fetch profile',
    },
    401: {
      description: 'Unauthorized',
    },
  },
})