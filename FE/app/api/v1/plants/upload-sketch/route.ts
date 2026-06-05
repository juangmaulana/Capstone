import { ApiError } from '@/lib/api/api-error';
import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { uploadImage } from '@/server/upload';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export const runtime = 'nodejs';

const MAX_SKETCH_SIZE = Number(process.env.MAX_FILE_SIZE ?? 10 * 1024 * 1024);
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

async function saveSketchLocally(file: File) {
  const extension = IMAGE_EXTENSIONS[file.type];

  if (!extension) {
    throw new ApiError('BAD_REQUEST', 'Only JPG, PNG, WEBP, or GIF files are allowed');
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.${extension}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'herbarium-sketches');

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), bytes);

  return `/uploads/herbarium-sketches/${filename}`;
}

export const POST = withErrorHandling(async (req: NextRequest) => {
  const formData = await req.formData();
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    throw new ApiError('BAD_REQUEST', 'A valid image file is required');
  }

  if (file.size > MAX_SKETCH_SIZE) {
    throw new ApiError('BAD_REQUEST', 'Image file must be 10 MB or smaller');
  }

  try {
    const result = await uploadImage(file);
    return NextResponse.json({ success: true, data: { path: result.path } });
  } catch (err) {
    console.warn('[Upload Sketch] Upload service unavailable, saving locally:', err);
    const localPath = await saveSketchLocally(file);
    return NextResponse.json({ success: true, data: { path: localPath } });
  }
});
