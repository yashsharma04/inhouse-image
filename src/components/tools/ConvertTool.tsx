import { useState } from 'react';
import { formatBytes, formatLabel, readImageFile, type ListedImage } from '../../lib/files';
import type { OutputFormat } from '../../lib/image/detect';
import type { ProcessOptions, ProcessResult } from '../../lib/image/process';
import { imageJobs } from '../../workers';
import { DropZone } from '../DropZone';
import { ErrorMessage } from '../ErrorMessage';
import { toUserMessage } from '../errors';
import { ResultPanel } from '../ResultPanel';
import { useAction } from '../useAction';
import { useWarmWorkers } from '../useWarmWorkers';

const FORMATS: { value: ProcessOptions['format']; title: string; hint: string }[] = [
  { value: 'keep', title: 'Same as original', hint: 'HEIC becomes JPEG. Other formats stay as they are.' },
  { value: 'jpeg', title: 'JPEG', hint: 'Best for photos. Re-encoded at quality 0.8.' },
  { value: 'webp', title: 'WebP', hint: 'Usually smaller than JPEG at similar quality.' },
  { value: 'png', title: 'PNG', hint: 'Lossless. Can be larger than the original.' },
];

const SIZES: { value: number | null; title: string; hint: string }[] = [
  { value: null, title: 'Original size', hint: 'No resize. Only format and compression change.' },
  { value: 2048, title: '2048 px', hint: 'Long edge. Good for sharing and most screens.' },
  { value: 1920, title: '1920 px', hint: 'Full HD long edge.' },
  { value: 1280, title: '1280 px', hint: 'Smaller files for email and chat.' },
  { value: 1024, title: '1024 px', hint: 'Smallest of the presets.' },
];

let nextId = 0;

interface ListedItem extends ListedImage {
  id: string;
}

function resultTitle(result: ProcessResult): string {
  if (result.outputSize < result.originalSize) {
    const saved = Math.floor((1 - result.outputSize / result.originalSize) * 100);
    return saved < 1 ? 'Less than 1% smaller' : `${saved}% smaller`;
  }
  return result.count === 1 ? 'Your image is ready' : `${result.count} images ready`;
}

export function ConvertTool() {
  useWarmWorkers();
  const [items, setItems] = useState<ListedItem[]>([]);
  const [addErrors, setAddErrors] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [format, setFormat] = useState<ProcessOptions['format']>('keep');
  const [maxEdge, setMaxEdge] = useState<number | null>(null);
  const convert = useAction<ProcessResult>();

  const updateItems = (next: ListedItem[]) => {
    setItems(next);
    convert.reset();
  };

  const addFiles = async (files: File[]) => {
    setAdding(true);
    const added: ListedItem[] = [];
    const errors: string[] = [];
    for (const file of files) {
      try {
        added.push({ id: `file-${nextId++}`, ...(await readImageFile(file)) });
      } catch (error) {
        errors.push(toUserMessage(error));
      }
    }
    setAddErrors(errors);
    updateItems([...items, ...added]);
    setAdding(false);
  };

  const runConvert = () =>
    convert.run(async () => {
      const files = items.map(({ name, bytes }) => ({ name, bytes: bytes.slice() }));
      return imageJobs.run(
        'process',
        { files, options: { format, maxEdge } },
        files.map((file) => file.bytes.buffer as ArrayBuffer),
      );
    });

  const startOver = () => {
    convert.reset();
    setItems([]);
    setAddErrors([]);
  };

  if (convert.state.status === 'done') {
    const result = convert.state.result;
    return (
      <ResultPanel
        title={resultTitle(result)}
        detail={`${result.count === 1 ? '1 image' : `${result.count} images`} · ${formatBytes(result.originalSize)} → ${formatBytes(result.outputSize)}`}
        bytes={result.bytes}
        fileName={result.fileName}
        type={result.mime}
        resetLabel="Convert different images"
        onReset={startOver}
      />
    );
  }

  const working = convert.state.status === 'working';

  return (
    <div className="tool">
      <DropZone
        title={items.length === 0 ? 'Drop images here or click to choose' : 'Add more images'}
        hint="JPEG, PNG, WebP, or HEIC. Several files come back as a zip."
        multiple
        disabled={adding || working}
        onFiles={addFiles}
      />
      {addErrors.map((message) => (
        <ErrorMessage key={message} message={message} />
      ))}

      {items.length > 0 && (
        <ul className="file-list">
          {items.map((item) => (
            <li key={item.id} className="file-row">
              <div className="file-row__info">
                <p className="file-row__name">{item.name}</p>
                <p className="file-row__meta">
                  {formatLabel(item.format)} · {formatBytes(item.size)}
                </p>
              </div>
              <div className="file-row__actions">
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Remove ${item.name}`}
                  disabled={working}
                  onClick={() => updateItems(items.filter((other) => other.id !== item.id))}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <fieldset className="options" disabled={working}>
        <legend className="options__legend">Output format</legend>
        {FORMATS.map((option) => (
          <label key={option.value} className="option">
            <input
              type="radio"
              name="output-format"
              checked={format === option.value}
              onChange={() => {
                setFormat(option.value as OutputFormat | 'keep');
                convert.reset();
              }}
            />
            <span>
              <strong>{option.title}</strong>
              <span className="option__hint">{option.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="options" disabled={working}>
        <legend className="options__legend">Longest edge</legend>
        {SIZES.map((option) => (
          <label key={String(option.value)} className="option">
            <input
              type="radio"
              name="max-edge"
              checked={maxEdge === option.value}
              onChange={() => {
                setMaxEdge(option.value);
                convert.reset();
              }}
            />
            <span>
              <strong>{option.title}</strong>
              <span className="option__hint">{option.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <ErrorMessage message={convert.state.status === 'error' ? convert.state.message : null} />

      <div className="actions">
        <button type="button" className="button button--primary" disabled={items.length === 0 || working} onClick={runConvert}>
          {working ? 'Converting…' : 'Convert images'}
        </button>
        {items.length === 0 && <span className="actions__hint">Add at least one image.</span>}
      </div>
    </div>
  );
}
