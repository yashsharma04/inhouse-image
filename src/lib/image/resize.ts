import type { ImageFormat, OutputFormat } from './detect';

export function targetSize(
  width: number,
  height: number,
  maxEdge: number | null,
): { width: number; height: number; resized: boolean } {
  if (!maxEdge || Math.max(width, height) <= maxEdge) {
    return { width, height, resized: false };
  }
  const scale = maxEdge / Math.max(width, height);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    resized: true,
  };
}

export function decideOutputFormat(input: ImageFormat, requested: OutputFormat | 'keep'): OutputFormat {
  if (requested !== 'keep') return requested;
  return input === 'heic' ? 'jpeg' : input;
}

export function isAlreadyOptimized(
  input: ImageFormat,
  output: OutputFormat,
  resized: boolean,
  outputSize: number,
  originalSize: number,
): boolean {
  return input === output && !resized && outputSize >= originalSize;
}
