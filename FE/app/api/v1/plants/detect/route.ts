import { withErrorHandling } from "@/lib/api/errors/error-handler"
import { parseWithZod } from "@/lib/validation/parse-with-zod"
import { mapDetectionResponse } from "@/server/features/plant/mappers/map-detection-response"
import { ImageSchema } from "@/server/shared/schemas/image.schema"
import { NextRequest, NextResponse } from "next/server"
import { Client } from "@gradio/client"

const GRADIO_URL = process.env.DETECTION_API_URL || "http://194.233.74.133:7860"

export const POST = withErrorHandling(async (req: NextRequest) => {
  const formData = await req.formData()

  const input = parseWithZod(ImageSchema, {
    image: formData.get("image"),
  })

  const file = input.image as File

  // Convert File to Blob for Gradio client
  const arrayBuffer = await file.arrayBuffer()
  const blob = new Blob([arrayBuffer], { type: file.type })

  const client = await Client.connect(GRADIO_URL)
  const result = await client.predict("/predict", {
    image: blob,
  })

  // Gradio returns: result.data = [annotatedImage, boundingBoxJson]
  const gradioData = result.data as any[]

  const data = mapDetectionResponse(gradioData)

  if (!data?.plants?.length) {
    return NextResponse.json({
      success: false,
      data,
    });
  }

  return NextResponse.json({ success: true, data })
})