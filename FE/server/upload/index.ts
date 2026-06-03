const UPLOAD_API_URL = process.env.UPLOAD_API_URL;

export async function uploadImage(image: File) {
  const uploadFormData = new FormData();
  uploadFormData.append('image', image);
  // uploadFormData.append('latitude', '0');
  // uploadFormData.append('longitude', '0');

  const response =  await fetch(`${UPLOAD_API_URL}/api/upload`, {
    method: 'POST',
    body: uploadFormData
  });

  const json = await response.json();
  if (json.status !== 'success') {
    console.error(json);
    throw new Error(`[Upload API Error] ${json.error}`);
  }

  return json.data
}
