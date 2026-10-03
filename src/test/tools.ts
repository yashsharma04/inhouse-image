import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export function jpegFile(name: string, size = 2048): File {
  const bytes = new Uint8Array(size);
  bytes[0] = 0xff;
  bytes[1] = 0xd8;
  bytes[2] = 0xff;
  return new File([bytes], name, { type: 'image/jpeg' });
}

export function pngFile(name: string, size = 2048): File {
  const bytes = new Uint8Array(size);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return new File([bytes], name, { type: 'image/png' });
}

/** accept filtering is disabled so tests can drop non-image files and check validation. */
export function setupUser() {
  return userEvent.setup({ applyAccept: false });
}

export function fileInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('No file input rendered');
  return input;
}

export function button(name: string | RegExp): HTMLButtonElement {
  return screen.getByRole('button', { name }) as HTMLButtonElement;
}
