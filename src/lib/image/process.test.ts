import { describe, expect, it } from 'vitest';
import { unzipSync } from 'fflate';
import { ImageToolError } from './errors';
import { processImages, type ConvertFn } from './process';

function jpegHeader(): Uint8Array {
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
}

function pngHeader(): Uint8Array {
  return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
}

function heicHeader(): Uint8Array {
  const brand = [...'ftypheic'].map((char) => char.charCodeAt(0));
  return new Uint8Array([0, 0, 0, 20, ...brand]);
}

const convertSmaller: ConvertFn = async () => ({
  bytes: new Uint8Array(4).fill(7),
  width: 100,
  height: 80,
  sourceWidth: 100,
  sourceHeight: 80,
});

describe('processImages', () => {
  it('rejects a file that is not an image', async () => {
    const error = await processImages(
      [{ name: 'notes.txt', bytes: new TextEncoder().encode('hello') }],
      { format: 'keep', maxEdge: null },
      convertSmaller,
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ImageToolError);
    expect(error).toMatchObject({
      code: 'not-image',
      message: `"notes.txt" isn't a JPEG, PNG, WebP, or HEIC image.`,
    });
  });

  it('converts a single image and names it from the format', async () => {
    const result = await processImages(
      [{ name: 'vacation.heic', bytes: heicHeader() }],
      { format: 'keep', maxEdge: null },
      convertSmaller,
    );
    expect(result.fileName).toBe('vacation.jpg');
    expect(result.mime).toBe('image/jpeg');
    expect(result.count).toBe(1);
    expect(Array.from(result.bytes)).toEqual(Array.from(new Uint8Array(4).fill(7)));
  });

  it('appends the max edge when convert reports a resize', async () => {
    const result = await processImages(
      [{ name: 'photo.png', bytes: pngHeader() }],
      { format: 'webp', maxEdge: 2048 },
      async () => ({
        bytes: new Uint8Array(10),
        width: 2048,
        height: 1536,
        sourceWidth: 4000,
        sourceHeight: 3000,
      }),
    );
    expect(result.fileName).toBe('photo-2048.webp');
    expect(result.mime).toBe('image/webp');
  });

  it('zips multiple outputs and de-duplicates names', async () => {
    const result = await processImages(
      [
        { name: 'photo.jpg', bytes: jpegHeader() },
        { name: 'photo.jpeg', bytes: jpegHeader() },
      ],
      { format: 'jpeg', maxEdge: null },
      convertSmaller,
    );
    expect(result.fileName).toBe('images.zip');
    expect(result.mime).toBe('application/zip');
    expect(result.count).toBe(2);
    expect(Object.keys(unzipSync(result.bytes)).sort()).toEqual(['photo-2.jpg', 'photo.jpg']);
  });

  it('throws already-optimized when re-encoding does not shrink a same-format original', async () => {
    const original = jpegHeader();
    const error = await processImages(
      [{ name: 'small.jpg', bytes: original }],
      { format: 'keep', maxEdge: null },
      async () => ({
        bytes: new Uint8Array(original.byteLength),
        width: 10,
        height: 10,
        sourceWidth: 10,
        sourceHeight: 10,
      }),
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ImageToolError);
    expect(error).toMatchObject({
      code: 'already-optimized',
      message: `"small.jpg" is already as small as this setting can make it.`,
    });
  });

  it('rejects an empty list', async () => {
    const error = await processImages([], { format: 'keep', maxEdge: null }, convertSmaller).catch(
      (e: unknown) => e,
    );
    expect(error).toMatchObject({ code: 'empty-result' });
  });

  it('passes the chosen quality and each file rotation to convert', async () => {
    const seen: Array<{ quality: number; rotation: number | undefined }> = [];
    await processImages(
      [{ name: 'photo.jpg', bytes: jpegHeader(), rotation: 90 }],
      { format: 'jpeg', maxEdge: null, quality: 'strong' },
      async (file, plan) => {
        seen.push({ quality: plan.quality, rotation: file.rotation });
        return convertSmaller(file, plan);
      },
    );
    expect(seen).toEqual([{ quality: 0.55, rotation: 90 }]);
  });

  it('does not treat a rotated file as already optimized', async () => {
    const original = jpegHeader();
    const result = await processImages(
      [{ name: 'sideways.jpg', bytes: original, rotation: 90 }],
      { format: 'keep', maxEdge: null },
      async () => ({
        bytes: new Uint8Array(original.byteLength),
        width: 10,
        height: 8,
        sourceWidth: 10,
        sourceHeight: 8,
      }),
    );
    expect(result.fileName).toBe('sideways.jpg');
  });
});
