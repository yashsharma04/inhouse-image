import { createJobClient } from './client';
import type { ImageJobs } from './protocol';

export const imageJobs = createJobClient<ImageJobs>(
  () => new Worker(new URL('./image.worker.ts', import.meta.url), { type: 'module' }),
);
