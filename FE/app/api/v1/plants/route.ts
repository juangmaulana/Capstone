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
  const { data, total, limit, offset } = await plant.query.list(filter)

  const hasNext = offset + limit < total
  const hasPrev = offset > 0
  
  let next = null
  const nextUrl = new URL(req.url)
  if (hasNext) {
    nextUrl.searchParams.set('offset', String(offset + limit))
    next = nextUrl.toString()
  }

  let prev = null
  const prevUrl = new URL(req.url)
  if (hasPrev) {
    prevUrl.searchParams.set('offset', String(Math.max(offset - limit, 0)))
    prev = prevUrl.toString()
  }

  return NextResponse.json({ 
    success: true, 
    data, 
    meta: {
      total,
      limit,
      offset,
      totalPages: Math.ceil(total / limit),
      currentPage: Math.floor(offset / limit) + 1,
    },
    links: {
      prev,
      next,
    }
  })
})

export const POST = withErrorHandling(async (req: NextRequest) => {
  // TODO: add upload image logic and return the image url
  const body = await req.json()
  const input = parseWithZod(CreatePlantSchema, { ...body, imagePath: 'image/picture.jpg' })
  const data = await plant.command.create(input)

  return NextResponse.json({ success: true, data })
})