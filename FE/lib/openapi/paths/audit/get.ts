import { AuditFilterSchema } from '@/server/services/audit/schema/filter.schema';
import { registry } from '../../registry';

registry.registerPath({
  method: 'get',
  path: 'api/v1/audit',
  tags: ['Audit'],
  summary: 'Fetch all audit logs',
  security: [
    {
      bearerAuth: [],
    }
  ],
  request: {
    query: AuditFilterSchema
  },
  responses: {
    200: {
      description: 'Audit logs fetched',
    }
  }
})