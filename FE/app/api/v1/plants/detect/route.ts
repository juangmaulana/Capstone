import { withErrorHandling } from "@/lib/api/errors/error-handler"
import { parseWithZod } from "@/lib/validation/parse-with-zod"
import { mapDetectionResponse } from "@/server/features/plant/mappers/map-detection-response"
import { ImageSchema } from "@/server/shared/schemas/image.schema"
import { NextRequest, NextResponse } from "next/server"
import { Client } from "@gradio/client"

const DETECTION_API_URL = process.env.DETECTION_API_URL
const HF_SPACE_ID = process.env.HF_SPACE_ID

async function connectDetectionClient() {
  const targets = [DETECTION_API_URL, HF_SPACE_ID].filter(Boolean) as string[]

  if (!targets.length) {
    throw new Error("DETECTION_API_URL or HF_SPACE_ID must be defined in environment variables")
  }

  let lastError: unknown

  for (const target of targets) {
    try {
      return await Client.connect(target)
    } catch (err) {
      lastError = err
      console.warn(`[Detection] Failed to connect to ${target}`)
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Detection service is unavailable")
}

export const POST = withErrorHandling(async (req: NextRequest) => {
  const formData = await req.formData()

  const input = parseWithZod(ImageSchema, {
    image: formData.get("image"),
  })

  const file = input.image as File

  // Convert File to Blob for Gradio client
  const arrayBuffer = await file.arrayBuffer()
  const blob = new Blob([arrayBuffer], { type: file.type })

  const client = await connectDetectionClient()
  const result = await client.predict("/predict", {
    image: blob,
  })

  // Gradio returns: result.data = [annotatedImage, boundingBoxJson]
  const gradioData = result.data as unknown[]

  const data = mapDetectionResponse(gradioData)

  if (!data?.plants?.length) {
    return NextResponse.json({
      success: false,
      data,
    });
  }

  return NextResponse.json({ success: true, data })
})
