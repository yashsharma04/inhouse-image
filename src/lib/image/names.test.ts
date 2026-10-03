import { describe, expect, it } from 'vitest';
import { outputFileName, uniqueNames } from './names';

describe('outputFileName', () => {
  it('keeps the base name and uses jpg for JPEG', () => {
    expect(outputFileName('vacation.HEIC', 'jpeg', false, null)).toBe('vacation.jpg');
  });

  it('appends the longest-edge size when the image was resized', () => {
    expect(outputFileName('photo.png', 'webp', true, 2048)).toBe('photo-2048.webp');
  });

  it('does not append a size when the image was not resized', () => {
    expect(outputFileName('photo.png', 'png', false, 2048)).toBe('photo.png');
  });

  it('strips only the last extension', () => {
    expect(outputFileName('my.photo.jpeg', 'png', false, null)).toBe('my.photo.png');
  });
});

describe('uniqueNames', () => {
  it('leaves distinct names alone', () => {
    expect(uniqueNames(['a.jpg', 'b.png'])).toEqual(['a.jpg', 'b.png']);
  });

  it('suffixes duplicates starting at 2', () => {
    expect(uniqueNames(['photo.jpg', 'photo.jpg', 'other.webp'])).toEqual([
      'photo.jpg',
      'photo-2.jpg',
      'other.webp',
    ]);
  });
});
