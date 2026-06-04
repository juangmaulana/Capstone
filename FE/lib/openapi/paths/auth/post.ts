import { resetPasswordSchema } from '@/server/services/auth/schemas/reset-password.schema';
import { registry } from '../../registry';
import { loginSchema } from '@/server/services/auth/schemas/login.schema';
import { verifyResetCodeSchema } from '@/server/services/auth/schemas/verify-reset-code.schema';
import { forgotPasswordSchema } from '@/server/services/auth/schemas/forgot-password.schema';

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login',
  tags: ['Auth'],
  summary: 'Login',
  request: {
    body: {
      content: {
        'application/json': {
          schema: loginSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Login successful',
    },
    400: {
      description: 'Invalid input',
    },
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/logout',
  tags: ['Auth'],
  summary: 'Logout',
  responses: {
    200: {
      description: 'Logout successful',
    },
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/refresh',
  tags: ['Auth'],
  summary: 'Refresh',
  responses: {
    200: {
      description: 'Refresh successful',
    },
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/forgot-password',
  tags: ['Auth'],
  summary: 'Forgot password',
  request: {
    body: {
      content: {
        'application/json': {
          schema: forgotPasswordSchema,
        },
      },
    }
  },
  responses: {
    200: {
      description: 'Forgot password request successfully sent',
    },
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/verify-reset-code',
  tags: ['Auth'],
  summary: 'Verify reset code',
  request: {
    body: {
      content: {
        'application/json': {
          schema: verifyResetCodeSchema,
        },
      },
    }
  },
  responses: {
    200: {
      description: 'Reset code verified',
    },
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/reset-password',
  tags: ['Auth'],
  summary: 'Reset password',
  request: {
    body: {
      content: {
        'application/json': {
          schema: resetPasswordSchema,
        },
      },
    }
  },
  responses: {
    200: {
      description: 'Password successfully reset to new pasword',
    },
  },
})