import type { ImageErrorCode } from '../lib/image/errors';
import type { ImageFile, ProcessOptions, ProcessResult } from '../lib/image/process';

/**
 * Maps job kinds to their input and output. Each worker serves one such map.
 * Maps are declared as type aliases (not interfaces extending JobMap) so the
 * index signature doesn't widen their keys.
 */
export type JobMap = Record<string, { input: unknown; output: unknown }>;

export type ImageJobs = {
  process: { input: { files: ImageFile[]; options: ProcessOptions }; output: ProcessResult };
};

export interface JobRequest {
  id: number;
  kind: string;
  input: unknown;
}

export type JobResponse =
  | { id: number; ok: true; output: unknown }
  | { id: number; ok: false; error: { code?: ImageErrorCode; message: string } };

/** The part of Worker / MessagePort used by the job client and host. */
export interface MessageEndpoint {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
}
