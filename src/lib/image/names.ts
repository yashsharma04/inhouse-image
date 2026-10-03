import type { OutputFormat } from './detect';

const EXTENSIONS: Record<OutputFormat, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
};

export function outputFileName(
  fileName: string,
  format: OutputFormat,
  resized: boolean,
  maxEdge: number | null,
): string {
  const base = fileName.replace(/\.[^.]+$/, '');
  const ext = EXTENSIONS[format];
  if (resized && maxEdge) return `${base}-${maxEdge}.${ext}`;
  return `${base}.${ext}`;
}

export function uniqueNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const count = seen.get(name) ?? 0;
    seen.set(name, count + 1);
    if (count === 0) return name;
    const dot = name.lastIndexOf('.');
    const base = dot === -1 ? name : name.slice(0, dot);
    const ext = dot === -1 ? '' : name.slice(dot);
    return `${base}-${count + 1}${ext}`;
  });
}

export function mimeOfFileName(fileName: string): string {
  if (fileName.endsWith('.png')) return 'image/png';
  if (fileName.endsWith('.webp')) return 'image/webp';
  if (fileName.endsWith('.zip')) return 'application/zip';
  return 'image/jpeg';
}
