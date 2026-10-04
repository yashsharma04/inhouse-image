import { describe, expect, it } from 'vitest';
import { decideOutputFormat, isAlreadyOptimized, nextRotation, orientedSize, targetSize } from './resize';

describe('targetSize', () => {
  it('leaves the size unchanged when no max edge is set', () => {
    expect(targetSize(4000, 3000, null)).toEqual({ width: 4000, height: 3000, resized: false });
  });

  it('does not upscale images already inside the max edge', () => {
    expect(targetSize(800, 600, 2048)).toEqual({ width: 800, height: 600, resized: false });
  });

  it('scales the longest edge down and keeps aspect ratio', () => {
    expect(targetSize(4000, 3000, 2000)).toEqual({ width: 2000, height: 1500, resized: true });
    expect(targetSize(3000, 4000, 2000)).toEqual({ width: 1500, height: 2000, resized: true });
  });
});

describe('decideOutputFormat', () => {
  it('returns the requested format', () => {
    expect(decideOutputFormat('png', 'webp')).toBe('webp');
  });

  it('keeps the input format, except HEIC which becomes JPEG', () => {
    expect(decideOutputFormat('png', 'keep')).toBe('png');
    expect(decideOutputFormat('heic', 'keep')).toBe('jpeg');
  });
});

describe('isAlreadyOptimized', () => {
  it('is true only when format is unchanged, size is unchanged, and output is not smaller', () => {
    expect(isAlreadyOptimized('jpeg', 'jpeg', false, 1000, 900)).toBe(true);
    expect(isAlreadyOptimized('jpeg', 'jpeg', false, 800, 900)).toBe(false);
    expect(isAlreadyOptimized('jpeg', 'webp', false, 1000, 900)).toBe(false);
    expect(isAlreadyOptimized('jpeg', 'jpeg', true, 1000, 900)).toBe(false);
    expect(isAlreadyOptimized('heic', 'jpeg', false, 1000, 900)).toBe(false);
  });

  it('is never true when the image was rotated', () => {
    expect(isAlreadyOptimized('jpeg', 'jpeg', false, 1000, 900, true)).toBe(false);
  });
});

describe('orientedSize', () => {
  it('swaps sides for a quarter turn', () => {
    expect(orientedSize(4000, 3000, 90)).toEqual({ width: 3000, height: 4000 });
    expect(orientedSize(4000, 3000, 270)).toEqual({ width: 3000, height: 4000 });
    expect(orientedSize(4000, 3000, 180)).toEqual({ width: 4000, height: 3000 });
  });
});

describe('nextRotation', () => {
  it('steps 90 degrees and wraps', () => {
    expect(nextRotation(0)).toBe(90);
    expect(nextRotation(270)).toBe(0);
  });
});
