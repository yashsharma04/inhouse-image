export type ImageErrorCode = 'not-image' | 'corrupt' | 'empty-result' | 'already-optimized';

/** An expected failure whose `message` is safe to show to the user as-is. */
export class ImageToolError extends Error {
  readonly code: ImageErrorCode;

  constructor(code: ImageErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ImageToolError';
    this.code = code;
  }
}
