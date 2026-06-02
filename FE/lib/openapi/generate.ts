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
        name: 'Users',
        description: 'Manage users, including creation, updates, deletion, role assignment, and user lookup.',
      },
      {
        name: 'Roles',
        description: 'Define and manage roles and permissions for role-based access control.',
      },
      {
        name: 'Plants',
        description: 'Manage plant records, including botanical data, taxonomy, and environmental information.',
      },
      {
        name: 'Images',
        description: 'Handle image uploads, storage, retrieval, and association with identifications.',
      },
      {
        name: 'Identifications',
        description: 'Manage plant identification records and related classification or matching results.',
      },
      {
        name: 'Auth',
        description: 'Authentication and Authorization related endpoints.'
      },
    ],
  })
}