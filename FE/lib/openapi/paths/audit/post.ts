import { LogEventSchema } from '@/server/services/audit/schema/log.schema';
import { registry } from '../../registry';

registry.registerPath({
  method: 'post',
  path: 'api/v1/audit',
  tags: ['Audit'],
  summary: 'Record/log an event',
  security: [
    {
      bearerAuth: [],
    }
  ],
  request: {
    body: {
      content: {
        "application/json": {
          schema: LogEventSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: 'Event recorded/logged',
    }
  }
})