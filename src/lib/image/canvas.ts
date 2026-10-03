import decodeHeic from 'heic-decode';
import { IMAGE_MIME, type ImageFormat, type OutputFormat } from './detect';
import { ImageToolError } from './errors';
import type { ConvertFn } from './process';
import { targetSize } from './resize';

function asErrorCause(error: unknown): ErrorOptions | undefined {
  return error instanceof Error ? { cause: error } : undefined;
}

function requireContext(canvas: OffscreenCanvas): OffscreenCanvasRenderingContext2D {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2d canvas context is unavailable');
  return context;
}

async function decodeToBitmap(bytes: Uint8Array, format: ImageFormat, fileName: string): Promise<ImageBitmap> {
  try {
    if (format === 'heic') {
      const decoded = await decodeHeic({ buffer: bytes });
      const canvas = new OffscreenCanvas(decoded.width, decoded.height);
      const pixels = new Uint8ClampedArray(decoded.data);
      requireContext(canvas).putImageData(new ImageData(pixels, decoded.width, decoded.height), 0, 0);
      return canvas.transferToImageBitmap();
    }
    const blob = new Blob([bytes as BlobPart], { type: IMAGE_MIME[format] });
    return await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch (error) {
    throw new ImageToolError(
      'corrupt',
      `We couldn't read "${fileName}". The file may be damaged.`,
      asErrorCause(error),
    );
  }
}

async function encodeBitmap(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  format: OutputFormat,
  quality: number,
): Promise<Uint8Array> {
  const canvas = new OffscreenCanvas(width, height);
  requireContext(canvas).drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await canvas.convertToBlob({
    type: IMAGE_MIME[format],
    quality: format === 'png' ? undefined : quality,
  });
  return new Uint8Array(await blob.arrayBuffer());
}

export const convertOnCanvas: ConvertFn = async (file, plan) => {
  const bitmap = await decodeToBitmap(file.bytes, plan.inputFormat, file.name);
  const sourceWidth = bitmap.width;
  const sourceHeight = bitmap.height;
  const size = targetSize(sourceWidth, sourceHeight, plan.maxEdge);
  const bytes = await encodeBitmap(bitmap, size.width, size.height, plan.outputFormat, plan.quality);
  return { bytes, width: size.width, height: size.height, sourceWidth, sourceHeight };
};
