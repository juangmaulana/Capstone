import { withErrorHandling } from "@/lib/api/errors/error-handler"
import { parseWithZod } from "@/lib/validation/parse-with-zod"
import { mapDetectionResponse } from "@/server/features/seach/mappers/map-detection-response"
import { ImageSchema } from "@/server/shared/schemas/image.schema"
import { NextRequest, NextResponse } from "next/server"

export const POST = withErrorHandling(async (req: NextRequest) => {
  const formData = await req.formData()

  const input = parseWithZod(ImageSchema, {
    image: formData.get("image"),
  })

  const file = input.image as File

  const forwardForm = new FormData()
  forwardForm.append("image", file)

  const response = await fetch("http://localhost:5001/detect", {
    method: "POST",
    body: forwardForm,
  })

  if (!response.ok) {
    throw new Error("Detection request failed")
  }

  const flaskData = await response.json()

  const data = mapDetectionResponse(flaskData.data)

  return NextResponse.json({ success: true, data })
})