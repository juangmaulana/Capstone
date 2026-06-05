import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { getLinks } from '@/lib/next-pagination';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { db } from '@/server/db';
import { getAuditLogs, logEvent } from '@/server/services/audit';
import { AuditFilterSchema } from '@/server/services/audit/schema/filter.schema';
import { LogEventRequest, LogEventSchema } from '@/server/services/audit/schema/log.schema';
import { sql } from 'kysely';
import { NextRequest, NextResponse } from 'next/server';

const normalizeAuditLog = (row: {
  id: string
  actor_id: string
  entity_id: string
  entity_type: string
  action: string
  message: string
  created_at: Date | string
}) => ({
  id: row.id,
  actorId: row.actor_id,
  entityId: row.entity_id,
  entityType: row.entity_type,
  action: row.action,
  message: row.message,
  createdAt: row.created_at,
})

const getLocalAuditLogs = async (filter: {
  entityType?: string
  action?: string
  limit?: number
  page?: number
}) => {
  await ensureLocalAuditLogsTable()
  const limit = filter.limit ?? 20
  const page = filter.page ?? 1
  const offset = (page - 1) * limit

  let query = db.selectFrom('audit_logs')

  if (filter.entityType) query = query.where('entity_type', '=', filter.entityType)
  if (filter.action) query = query.where('action', '=', filter.action)

  const totalResult = await query
    .select((eb) => eb.fn.count<string>('id').as('count'))
    .executeTakeFirst()
  const total = Number(totalResult?.count ?? 0)

  const data = await query
    .selectAll()
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset)
    .execute()
    .then((rows) => rows.map(normalizeAuditLog))

  return { data, total, limit, page }
}

const logLocalEvent = async (input: LogEventRequest) => {
  await ensureLocalAuditLogsTable()
  const row = await db
    .insertInto('audit_logs')
    .values({
      id: crypto.randomUUID(),
      actor_id: input.actorId,
      entity_id: input.entityId,
      entity_type: input.entityType,
      action: input.action,
      message: input.message ?? `${input.action} ${input.entityType} ${input.entityId}`,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return normalizeAuditLog(row)
}

const ensureLocalAuditLogsTable = async () => {
  await sql`
    create table if not exists audit_logs (
      id uuid primary key,
      actor_id varchar(255) not null,
      entity_id varchar(255) not null,
      entity_type varchar(255) not null,
      action varchar(255) not null,
      message varchar(255) not null,
      created_at timestamp not null default CURRENT_TIMESTAMP
    )
  `.execute(db)
}

export const GET = withErrorHandling(async (req: NextRequest) => {
  const searchParams = {
    entityType: req.nextUrl.searchParams.get("entityType") ?? undefined,
    action: req.nextUrl.searchParams.get("action") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
    page: req.nextUrl.searchParams.get("page") ?? undefined,
  }
  const filter = parseWithZod(AuditFilterSchema, searchParams)
  let result: Awaited<ReturnType<typeof getLocalAuditLogs>>
  try {
    result = await getAuditLogs(filter)
  } catch (error) {
    console.warn('Audit service unavailable, reading local audit_logs:', error)
    result = await getLocalAuditLogs(filter)
  }
  const { data, total, limit, page } = result
    
  const { prev, next } = getLinks(total, limit, page, req.url);

  return NextResponse.json({ 
    success: true, 
    data, 
    meta: {
      total,
      limit,
      page,
    },
    links: {
      prev,
      next,
    }
  })
})

export const POST = withErrorHandling(async (req: NextRequest) => {
  const input = parseWithZod(LogEventSchema, await req.json())
  let data: unknown
  try {
    data = await logEvent(input)
  } catch (error) {
    console.warn('Audit service unavailable, writing local audit_logs:', error)
    data = await logLocalEvent(input)
  }
  
  return NextResponse.json({ 
    success: true, 
    data
  })
})
