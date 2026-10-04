export interface Faq {
  question: string;
  answer: string;
}

export interface Tool {
  slug: string;
  name: string;
  /** One line used on cards and in links. */
  summary: string;
  title: string;
  description: string;
  heading: string;
  promise: string;
  steps: [string, string, string];
  faqs: Faq[];
}

const privacyFaq: Faq = {
  question: 'Are my files uploaded anywhere?',
  answer:
    'No. Your photos are processed by your own browser and never leave your device. The site also sends a security policy that tells your browser to block uploads to any server, so this is enforced, not just promised.',
};

const freeFaq: Faq = {
  question: 'Is it free?',
  answer: 'Yes. No account, no watermark, no daily limits.',
};

const sizeFaq: Faq = {
  question: 'Is there a file size limit?',
  answer:
    "There's no fixed limit. Because everything runs on your device, very large photos depend on your device's memory. Files of a few hundred megabytes work on most laptops.",
};

export const tools = {
  convert: {
    slug: 'convert',
    name: 'Convert',
    summary: 'Convert, compress, and resize photos in a batch.',
    title: 'Convert, compress, and resize images privately, in your browser',
    description:
      'Convert JPEG, PNG, WebP, and HEIC photos, compress them, and resize the long edge. Free, no sign-up, and your files never leave your device.',
    heading: 'Convert images',
    promise: 'Convert, compress, and resize. Nothing is uploaded.',
    steps: [
      'Drop one or more photos onto the page.',
      'Pick a format, a quality level, and an optional long-edge size. Rotate any photo that is sideways.',
      'Click Convert and download the result. Several files come back as a zip.',
    ],
    faqs: [
      privacyFaq,
      {
        question: 'Which formats can I use?',
        answer:
          'You can drop JPEG, PNG, WebP, and HEIC / HEIF. Output is JPEG, PNG, or WebP. HEIC is decoded only — the site never writes HEIC.',
      },
      {
        question: 'What happens to iPhone HEIC photos?',
        answer:
          'They are decoded in your browser and written as JPEG, PNG, or WebP. Live Photo bursts are not kept; only the main still is converted.',
      },
      {
        question: 'How does compression work?',
        answer:
          'JPEG and WebP use the quality you pick: Light, Recommended, or Strong. PNG stays lossless. Re-encoding also drops location and camera metadata. If you keep the original format, do not resize or rotate, and the new file is not smaller, we leave it alone and tell you.',
      },
      {
        question: 'Can I rotate a photo?',
        answer: 'Yes. Use the rotate button on each file. It turns 90° at a time.',
      },
      {
        question: 'Will resizing upscale a small photo?',
        answer: 'No. The long-edge limit only shrinks images that are larger than the size you pick.',
      },
      freeFaq,
      sizeFaq,
    ],
  },
} satisfies Record<string, Tool>;

export const toolList: Tool[] = Object.values(tools);
