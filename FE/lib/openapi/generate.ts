import './paths'
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
        name: 'Auth',
        description: 'Authentication and Authorization related endpoints.'
      },
      {
        name: 'Plants',
        description: 'Manage plant records, including botanical data, taxonomy, and environmental information.',
      },
      {
        name: 'Identifications',
        description: 'Manage plant identification records and related classification or matching results.',
      },
      {
        name: 'Users',
        description: 'Manage users, including creation, updates, deletion, and user lookup.',
      },
      {
        name: 'Roles',
        description: 'Retrieve catalog of roles used for RBAC.',
      },
    ],
  })
}