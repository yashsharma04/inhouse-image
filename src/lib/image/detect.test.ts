import { describe, expect, it } from 'vitest';
import { detectFormat } from './detect';

function ascii(text: string): number[] {
  return [...text].map((char) => char.charCodeAt(0));
}

function withHeader(bytes: number[]): Uint8Array {
  return new Uint8Array(bytes);
}

function heic(brand: string): Uint8Array {
  return withHeader([0, 0, 0, 20, ...ascii('ftyp'), ...ascii(brand), ...ascii('mif1')]);
}

describe('detectFormat', () => {
  it('detects JPEG from the SOI marker', () => {
    expect(detectFormat(withHeader([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpeg');
  });

  it('detects PNG from the signature', () => {
    expect(detectFormat(withHeader([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('png');
  });

  it('detects WebP from the RIFF/WEBP container', () => {
    expect(detectFormat(withHeader([...ascii('RIFF'), 0, 0, 0, 0, ...ascii('WEBP')]))).toBe('webp');
  });

  it.each(['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'])('detects HEIC brand %s', (brand) => {
    expect(detectFormat(heic(brand))).toBe('heic');
  });

  it('rejects empty and truncated bytes', () => {
    expect(detectFormat(new Uint8Array())).toBeNull();
    expect(detectFormat(withHeader([0xff, 0xd8]))).toBeNull();
    expect(detectFormat(withHeader([...ascii('RIFF')]))).toBeNull();
  });

  it('rejects other files, including PDFs', () => {
    expect(detectFormat(withHeader([...ascii('%PDF-1.7')]))).toBeNull();
    expect(detectFormat(withHeader([...ascii('GIF89a')]))).toBeNull();
  });
});
