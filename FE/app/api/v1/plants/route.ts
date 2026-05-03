import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { plant } from '@/server/features/plant';
import { CreatePlantSchema } from '@/server/features/plant/schemas/create.schema';
import { PlantFilterSchema } from '@/server/features/plant/schemas/filter.schema';
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const searchParams = {
    search: req.nextUrl.searchParams.get("search") ?? undefined,
    family: req.nextUrl.searchParams.get("family") ?? undefined,
    genus: req.nextUrl.searchParams.get("genus") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
    offset: req.nextUrl.searchParams.get("offset") ?? undefined,
  }
  const filter = parseWithZod(PlantFilterSchema, searchParams)
  const data = await plant.query.list(filter)

  return NextResponse.json({ success: true, data, meta: {}})
})

export const POST = withErrorHandling(async (req: NextRequest) => {
  const input = parseWithZod(CreatePlantSchema, await req.json())
  const data = await plant.command.create(input)

  return NextResponse.json({ success: true, data })
})