import { detectFormat, type ImageFormat } from './image/detect';
import { ImageToolError } from './image/errors';
import type { ImageFile } from './image/process';

export interface ListedImage extends ImageFile {
  format: ImageFormat;
  size: number;
}

export async function readImageFile(file: File): Promise<ListedImage> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const format = detectFormat(bytes);
  if (!format) {
    throw new ImageToolError(
      'not-image',
      `"${file.name}" isn't a JPEG, PNG, WebP, or HEIC image.`,
    );
  }
  return { name: file.name, bytes, format, size: file.size };
}

export function downloadBytes(bytes: Uint8Array, fileName: string, type: string): void {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

const UNITS = ['B', 'KB', 'MB', 'GB'] as const;

export function formatBytes(size: number): string {
  let value = size;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = unit === 0 || value >= 10 ? 0 : 1;
  return `${value.toFixed(digits)} ${UNITS[unit]}`;
}

export function formatLabel(format: ImageFormat): string {
  return format === 'jpeg' ? 'JPEG' : format === 'png' ? 'PNG' : format === 'webp' ? 'WebP' : 'HEIC';
}
