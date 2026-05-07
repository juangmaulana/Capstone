import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { plant } from '@/server/features/plant';
import { UpdatePlantSchema } from '@/server/features/plant/schemas/update.schema';
import { IdSchema } from '@/server/shared/schemas/id.schema';
import { NextRequest, NextResponse } from "next/server";

export const DELETE = withErrorHandling(async (
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = parseWithZod(IdSchema, await params)
  const data = await plant.command.delete(id)

  return NextResponse.json({ success: true, data })
})

export const GET = withErrorHandling(async (
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = parseWithZod(IdSchema, await params)
  const data = await plant.query.byId(id)

  return NextResponse.json({ success: true, data })
})

export const PATCH = withErrorHandling(async (
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = parseWithZod(IdSchema, await params)
  const body = await req.json()
  const input = parseWithZod(UpdatePlantSchema, body)
  
  const data = await plant.command.update(id, input)

  if (!data) {
    return NextResponse.json(
      { success: false, error: { message: "Plant not found" } },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data })
})
