import { getSupabase } from './supabase';

const BUCKET = 'avatars';

/**
 * Upload a photo to Supabase Storage and return the public URL.
 * Files are stored as avatars/{personId}.{ext}
 */
export async function uploadPhoto(personId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const filePath = `${personId}.${ext}`;

  // Remove existing file first (ignore errors if it doesn't exist)
  await getSupabase().storage.from(BUCKET).remove([filePath]);

  const { error: uploadError } = await getSupabase().storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) throw uploadError;

  const { data } = getSupabase().storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Upload a photo from a URL (downloads and re-uploads to storage)
 */
export async function uploadPhotoFromUrl(
  personId: string,
  url: string
): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
  const file = new File([blob], `${personId}.${ext}`, { type: blob.type });
  return uploadPhoto(personId, file);
}

/**
 * Delete a person's photo from Supabase Storage
 */
export async function deletePhoto(personId: string): Promise<void> {
  // Try common extensions
  const extensions = ['jpg', 'jpeg', 'png', 'webp'];
  const paths = extensions.map((ext) => `${personId}.${ext}`);
  const { error } = await getSupabase().storage.from(BUCKET).remove(paths);
  if (error) throw error;
}
