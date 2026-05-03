import { ApiReference } from '@scalar/nextjs-api-reference'
import { generateOpenApiDoc } from '@/lib/openapi/generate'

export const GET = ApiReference({
  theme: 'default',
  orderSchemaPropertiesBy: 'preserve',
  content: generateOpenApiDoc,
})