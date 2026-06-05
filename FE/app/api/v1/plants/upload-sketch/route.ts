import { ApiError } from '@/lib/api/api-error';
import { withErrorHandling } from '@/lib/api/errors/error-handler';
import { uploadImage } from '@/server/upload';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const formData = await req.formData();
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    throw new ApiError('BAD_REQUEST', 'A valid image file is required');
  }

  const result = await uploadImage(file);
  return NextResponse.json({ success: true, data: { path: result.path } });
});
