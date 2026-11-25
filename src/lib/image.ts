// On-device photo resizing: keeps progress photos small. No upload, no library.

export const PHOTO_MAX_EDGE = 1080;

/** Scales (w, h) down so the long edge is at most `max`; never scales up. */
export function fitWithin(w: number, h: number, max = PHOTO_MAX_EDGE): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(w, h));
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

/** Resizes an image file to a JPEG whose long edge is ≤ 1080px. Modern browsers apply the photo's rotation when drawing. */
export async function resizeToJpeg(file: Blob, quality = 0.8): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process photo'))), 'image/jpeg', quality),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
