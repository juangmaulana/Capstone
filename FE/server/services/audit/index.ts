import { ApiError } from '@/lib/api/api-error';
import { AuditFilterRequest } from './schema/filter.schema';
import { LogEventRequest } from './schema/log.schema';

const AUDIT_API_URL = process.env.AUDIT_API_URL

export const logEvent = async (req: LogEventRequest) => {
  const response = await fetch(`${AUDIT_API_URL}/api/audit/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...req })
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(`[Audit Service] ${json.error.message}`);
  }

  return json.data
};

export const getAuditLogs = async (req: AuditFilterRequest) => {
  const pageQuery = req.page ? `page=${req.page}` : '';
  const limitQuery = req.limit ? `limit=${req.limit}` : '';
  const entityTypeQuery = req.entityType ? `entityType=${req.entityType}` : '';
  const actionQuery = req.action ? `action=${req.action}` : '';

  const response = await fetch(`${AUDIT_API_URL}/api/audit?${pageQuery}&${limitQuery}&${entityTypeQuery}&${actionQuery}`)

  const json = await response.json();
  if (!json.success) {
    console.log(json)
    if (json.statusCode === 400 || json.error.statusCode === 400) {
      throw new ApiError('BAD_REQUEST', json.message || json.error.message);
    }
    throw new Error(`[Audit Service] ${json.error.message || json.message}`);
  }

  return json.data
}