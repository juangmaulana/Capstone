import { ApiError } from '@/lib/api/api-error';

const UPLOAD_API_URL = process.env.UPLOAD_API_URL;

export async function uploadImage(image: File) {
  const uploadFormData = new FormData();
  uploadFormData.append('image', image);

  const response = await fetch(`${UPLOAD_API_URL}/api/upload/r2`, {
    method: 'POST',
    body: uploadFormData
  });

  const json = await response.json();
  if (json.status !== 'success') {
    throw new ApiError('UNKNOWN', `[Upload API Error] ${json.message}`);
  }

  return json.data
}

export async function deleteImage(path: string) {
  const response = await fetch(`${UPLOAD_API_URL}/api/upload/r2`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: path })
  });

  const json = await response.json();
  if (json.status !== 'success') {
    throw new ApiError('UNKNOWN', `[Upload API Error] ${json.message}`);
  }

  return json.data
}