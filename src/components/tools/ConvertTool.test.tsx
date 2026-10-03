// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../workers', () => ({
  imageJobs: { run: vi.fn(), warm: vi.fn() },
}));
vi.mock('../../lib/files', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/files')>()),
  downloadBytes: vi.fn(),
}));

import { downloadBytes } from '../../lib/files';
import { ImageToolError } from '../../lib/image/errors';
import { button, fileInput, jpegFile, pngFile, setupUser } from '../../test/tools';
import { imageJobs } from '../../workers';
import { ConvertTool } from './ConvertTool';

const run = vi.mocked(imageJobs.run);
const RESULT = {
  bytes: new Uint8Array(10),
  fileName: 'photo.jpg',
  mime: 'image/jpeg',
  originalSize: 4 * 1024 * 1024,
  outputSize: 1024 * 1024,
  count: 1,
};

beforeEach(() => {
  vi.mocked(imageJobs.warm).mockReset();
  vi.mocked(downloadBytes).mockReset();
  run.mockReset().mockResolvedValue(RESULT);
});

async function renderWithFile(file = jpegFile('photo.jpg')) {
  const user = setupUser();
  render(<ConvertTool />);
  await user.upload(fileInput(), [file]);
  await screen.findByText(file.name);
  return user;
}

describe('ConvertTool', () => {
  it('preloads the worker on mount', () => {
    render(<ConvertTool />);
    expect(imageJobs.warm).toHaveBeenCalled();
    expect(button('Convert images')).toBeDisabled();
  });

  it('defaults to keeping the original format and size', async () => {
    await renderWithFile();
    expect(screen.getByRole('radio', { name: /Same as original/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Original size/ })).toBeChecked();
  });

  it('lists added files and rejects a non-image while keeping the valid ones', async () => {
    const user = setupUser();
    render(<ConvertTool />);
    await user.upload(fileInput(), [jpegFile('a.jpg'), new File(['hi'], 'notes.txt'), pngFile('b.png')]);
    expect(screen.getByRole('alert')).toHaveTextContent(`"notes.txt" isn't a JPEG, PNG, WebP, or HEIC image.`);
    expect(screen.getByText('a.jpg')).toBeInTheDocument();
    expect(screen.getByText('b.png')).toBeInTheDocument();
    expect(button('Convert images')).toBeEnabled();
  });

  it('converts with the chosen format and size and shows the saving', async () => {
    const user = await renderWithFile();
    await user.click(screen.getByRole('radio', { name: /WebP/ }));
    await user.click(screen.getByRole('radio', { name: /2048 px/ }));
    await user.click(button('Convert images'));

    expect(run).toHaveBeenCalledWith(
      'process',
      {
        files: [expect.objectContaining({ name: 'photo.jpg' })],
        options: { format: 'webp', maxEdge: 2048 },
      },
      expect.any(Array),
    );
    expect(await screen.findByText('75% smaller')).toBeInTheDocument();
    expect(screen.getByText('1 image · 4.0 MB → 1.0 MB')).toBeInTheDocument();
    await user.click(button('Download photo.jpg'));
    expect(downloadBytes).toHaveBeenCalledWith(expect.any(Uint8Array), 'photo.jpg', 'image/jpeg');
  });

  it('zips a batch and never overstates the saving', async () => {
    run.mockResolvedValue({
      bytes: new Uint8Array(10),
      fileName: 'images.zip',
      mime: 'application/zip',
      originalSize: 1_000_000,
      outputSize: 4000,
      count: 2,
    });
    const user = setupUser();
    render(<ConvertTool />);
    await user.upload(fileInput(), [jpegFile('a.jpg'), jpegFile('b.jpg')]);
    await user.click(button('Convert images'));
    expect(await screen.findByText('99% smaller')).toBeInTheDocument();
    expect(screen.getByText('2 images · 977 KB → 3.9 KB')).toBeInTheDocument();
    await user.click(button('Download images.zip'));
    expect(downloadBytes).toHaveBeenCalledWith(expect.any(Uint8Array), 'images.zip', 'application/zip');
  });

  it('tells the user when the file is already optimized', async () => {
    run.mockRejectedValue(
      new ImageToolError(
        'already-optimized',
        `"photo.jpg" is already as small as this setting can make it.`,
      ),
    );
    const user = await renderWithFile();
    await user.click(button('Convert images'));
    expect(await screen.findByRole('alert')).toHaveTextContent('"photo.jpg" is already as small as this setting can make it.');
  });

  it('clears a previous error when another format is picked', async () => {
    run.mockRejectedValue(new ImageToolError('already-optimized', 'already optimized'));
    const user = await renderWithFile();
    await user.click(button('Convert images'));
    await screen.findByRole('alert');
    await user.click(screen.getByRole('radio', { name: /^JPEG/ }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('starts over from the result screen', async () => {
    const user = await renderWithFile();
    await user.click(button('Convert images'));
    await user.click(await screen.findByRole('button', { name: 'Convert different images' }));
    expect(screen.getByText('Drop images here or click to choose')).toBeInTheDocument();
  });

  it('shows a generic message for unexpected failures', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    run.mockRejectedValue(new RangeError('out of memory'));
    const user = await renderWithFile();
    await user.click(button('Convert images'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong while processing the image.');
    expect(consoleError).toHaveBeenCalledWith(expect.any(RangeError));
    consoleError.mockRestore();
  });
});
