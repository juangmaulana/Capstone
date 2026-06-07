import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { identification } from '@/server/features/identification';
import { IdentificationStatisticsFilterSchema } from '@/server/features/identification/schemas/statistics.schema';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const searchParams = {
    year: req.nextUrl.searchParams.get('year') ?? undefined,
    plantId: req.nextUrl.searchParams.get('plantId') ?? undefined,
  }

  const filter = parseWithZod(IdentificationStatisticsFilterSchema, searchParams);
  const data = await identification.query.statistics(filter)
  
  return NextResponse.json({ success: true, data })
})