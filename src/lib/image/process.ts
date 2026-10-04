import { zipFiles } from '../zip';
import { detectFormat, type OutputFormat } from './detect';
import { ImageToolError } from './errors';
import { mimeOfFileName, outputFileName, uniqueNames } from './names';
import { decideOutputFormat, isAlreadyOptimized, type Rotation } from './resize';

export const QUALITY_LEVELS = ['light', 'recommended', 'strong'] as const;
export type QualityLevel = (typeof QUALITY_LEVELS)[number];

export const QUALITY_VALUE: Record<QualityLevel, number> = {
  light: 0.92,
  recommended: 0.8,
  strong: 0.55,
};

export interface ImageFile {
  name: string;
  bytes: Uint8Array;
  rotation?: Rotation;
}

export interface ProcessOptions {
  format: OutputFormat | 'keep';
  maxEdge: number | null;
  quality?: QualityLevel;
}

export interface ConvertedImage {
  bytes: Uint8Array;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
}

export type ConvertFn = (file: ImageFile, plan: ConvertPlan) => Promise<ConvertedImage>;

export interface ConvertPlan {
  inputFormat: NonNullable<ReturnType<typeof detectFormat>>;
  outputFormat: OutputFormat;
  maxEdge: number | null;
  quality: number;
}

export interface ProcessResult {
  bytes: Uint8Array;
  fileName: string;
  mime: string;
  originalSize: number;
  outputSize: number;
  count: number;
}

export async function processImages(
  files: ImageFile[],
  options: ProcessOptions,
  convert: ConvertFn,
): Promise<ProcessResult> {
  if (files.length === 0) {
    throw new ImageToolError('empty-result', 'Add at least one image.');
  }

  const outputs: ImageFile[] = [];
  let originalSize = 0;
  let outputSize = 0;

  for (const file of files) {
    const inputFormat = detectFormat(file.bytes);
    if (!inputFormat) {
      throw new ImageToolError(
        'not-image',
        `"${file.name}" isn't a JPEG, PNG, WebP, or HEIC image.`,
      );
    }

    const outputFormat = decideOutputFormat(inputFormat, options.format);
    const quality = QUALITY_VALUE[options.quality ?? 'recommended'];
    const converted = await convert(file, {
      inputFormat,
      outputFormat,
      maxEdge: options.maxEdge,
      quality,
    });
    const resized =
      converted.width !== converted.sourceWidth || converted.height !== converted.sourceHeight;
    const rotated = (file.rotation ?? 0) !== 0;

    if (
      isAlreadyOptimized(
        inputFormat,
        outputFormat,
        resized,
        converted.bytes.byteLength,
        file.bytes.byteLength,
        rotated,
      )
    ) {
      throw new ImageToolError(
        'already-optimized',
        `"${file.name}" is already as small as this setting can make it.`,
      );
    }

    outputs.push({ name: outputFileName(file.name, outputFormat, resized, options.maxEdge), bytes: converted.bytes });
    originalSize += file.bytes.byteLength;
    outputSize += converted.bytes.byteLength;
  }

  const named = uniqueNames(outputs.map((file) => file.name)).map((name, index) => ({
    name,
    bytes: outputs[index]!.bytes,
  }));

  if (named.length === 1) {
    const file = named[0]!;
    return {
      bytes: file.bytes,
      fileName: file.name,
      mime: mimeOfFileName(file.name),
      originalSize,
      outputSize,
      count: 1,
    };
  }

  return {
    bytes: zipFiles(named),
    fileName: 'images.zip',
    mime: 'application/zip',
    originalSize,
    outputSize,
    count: named.length,
  };
}
