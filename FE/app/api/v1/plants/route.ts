import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { getLinks } from '@/lib/next-pagination';
import { parseWithZod } from '@/lib/validation/parse-with-zod';
import { plant } from '@/server/features/plant';
import { CreatePlantSchema, CreatePlantWithFileSchema } from '@/server/features/plant/schemas/create.schema';
import { PlantFilterSchema } from '@/server/features/plant/schemas/filter.schema';
import { uploadImage } from '@/server/upload';
import { NextRequest, NextResponse } from "next/server";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const searchParams = {
    search: req.nextUrl.searchParams.get("search") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
    page: req.nextUrl.searchParams.get("page") ?? undefined,
  }
  const filter = parseWithZod(PlantFilterSchema, searchParams)
  const { data, total, limit, page } = await plant.query.list(filter)

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
  const formData = await req.formData()
  const bodyJson = Object.fromEntries(formData);
  const imageFile = formData.get('imageFile');

  const formInput = parseWithZod(CreatePlantWithFileSchema, {
    ...bodyJson,
    imageFile
  })

  const uploadResult = await uploadImage(formInput.imageFile as File);
  
  const input = parseWithZod(CreatePlantSchema, {
    ...formInput,
    imagePath: uploadResult.path,
  });
  const data = await plant.command.create(input);

  return NextResponse.json({ success: true, data }, { status: 201 })
})