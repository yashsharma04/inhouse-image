import { useEffect } from 'react';
import { imageJobs } from '../workers';

/** Fetches worker code as soon as a tool mounts, so the tool keeps working offline afterwards. */
export function useWarmWorkers() {
  useEffect(() => {
    imageJobs.warm();
  }, []);
}
