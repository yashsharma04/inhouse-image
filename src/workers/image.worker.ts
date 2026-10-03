/// <reference lib="webworker" />
import { convertOnCanvas } from '../lib/image/canvas';
import { processImages } from '../lib/image/process';
import { serveJobs } from './host';
import type { ImageJobs } from './protocol';

serveJobs<ImageJobs>(self, {
  process: ({ files, options }) => processImages(files, options, convertOnCanvas),
});
