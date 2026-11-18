const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

export function isAcceptedImage(file: File): boolean {
  return ACCEPTED.includes(file.type);
}

/** Scales an image so its longer side is at most `maxSide`, as WebP (JPEG where WebP encoding is unavailable). */
export async function resizeImage(file: File, maxSide = 1000): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const toBlob = (type: string) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, 0.85));
  const webp = await toBlob('image/webp');
  if (webp && webp.type === 'image/webp') return webp;
  const jpeg = await toBlob('image/jpeg');
  if (!jpeg) throw new Error('image encoding failed');
  return jpeg;
}
