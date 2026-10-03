import { zipSync } from 'fflate';

export function zipFiles(files: { name: string; bytes: Uint8Array }[]): Uint8Array {
  const entries = Object.fromEntries(files.map((file) => [file.name, file.bytes]));
  return zipSync(entries, { level: 0 });
}
