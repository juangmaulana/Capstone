import './register-paths'
import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { registry } from './registry'

export const generateOpenApiDoc = () => {
  const generator = new OpenApiGeneratorV3(registry.definitions)

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Dashboard CAPSTONE 12 BRIN',
      description: 'Official API documentation for Dashboard CAPSTONE 12 BRIN',
      version: '1.0.0',
    },
    tags: [
    {
      name: 'Users',
      description: 'Operations related to user management (CRUD, search, roles)',
    },
    {
      name: 'Roles',
      description: 'Role-based access control and permissions',
    },
    {
      name: 'Auth',
      description: 'Authentication and session management',
    },
  ],
  })
}