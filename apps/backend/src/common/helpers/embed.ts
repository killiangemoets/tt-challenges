import { pipeline } from '@xenova/transformers';

const MODEL = 'Xenova/all-MiniLM-L6-v2';
type Extractor = (
  text: string,
  options: { pooling: 'mean'; normalize: true },
) => Promise<{ data: Float32Array }>;
let extractorPromise: Promise<Extractor> | undefined;

export const embedText = async (text: string): Promise<number[]> => {
  extractorPromise ??= pipeline(
    'feature-extraction',
    MODEL,
  ) as unknown as Promise<Extractor>;
  const extractor = await extractorPromise;
  const output = await extractor(text, {
    pooling: 'mean',
    normalize: true,
  });
  const vector = Array.from(output.data as Float32Array);
  if (vector.length !== 384) {
    throw new Error(
      `Expected a 384-dimensional embedding, got ${vector.length}`,
    );
  }
  return vector;
};

export const EMBEDDING_MODEL = MODEL;
