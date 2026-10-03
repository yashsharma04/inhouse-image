import { unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { zipFiles } from './zip';

describe('zipFiles', () => {
  it('round-trips every file by name', () => {
    const zip = zipFiles([
      { name: 'a.jpg', bytes: new Uint8Array([1, 2]) },
      { name: 'b.webp', bytes: new Uint8Array([3]) },
    ]);
    const entries = unzipSync(zip);
    expect(Object.keys(entries)).toEqual(['a.jpg', 'b.webp']);
    expect(entries['b.webp']).toEqual(new Uint8Array([3]));
  });
});
