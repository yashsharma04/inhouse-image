import { ImageToolError } from '../lib/image/errors';

export const GENERIC_ERROR = 'Something went wrong while processing the image.';

export function toUserMessage(error: unknown): string {
  if (error instanceof ImageToolError) return error.message;
  console.error(error);
  return error instanceof Error && error.message === GENERIC_ERROR ? error.message : GENERIC_ERROR;
}
