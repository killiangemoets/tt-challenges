import { describe, expect, it } from 'vitest';

import { chunkMarkdown } from '../../src/common/helpers/chunk-markdown.js';

describe('chunkMarkdown', () => {
  it('returns no chunks for empty content', () => {
    expect(chunkMarkdown(' \r\n ')).toEqual([]);
  });

  it('normalizes newlines and carries ATX headings', () => {
    const chunks = chunkMarkdown(
      '# First\r\n\r\nAlpha\r\n\r\n## Second\r\nBeta',
    );
    expect(chunks.map((chunk) => chunk.heading)).toEqual([
      '# First',
      '## Second',
    ]);
    expect(chunks[0].content).toContain('# First\n\nAlpha');
  });

  it('preserves frontmatter as corpus text', () => {
    expect(chunkMarkdown('---\ntitle: Test\n---\n\nBody')[0].content).toContain(
      'title: Test',
    );
  });

  it('splits long content without exceeding 800 characters', () => {
    const chunks = chunkMarkdown(`# Heading\n\n${'word '.repeat(600)}`);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.content.length <= 800)).toBe(true);
    expect(chunks.map((chunk) => chunk.index)).toEqual(
      chunks.map((_, index) => index),
    );
  });

  it('overlaps consecutive chunks without emitting overlap-only chunks', () => {
    const chunks = chunkMarkdown(
      `${'alpha '.repeat(130)}\n\n${'beta '.repeat(130)}`,
    );
    expect(chunks.length).toBeGreaterThan(1);
    const firstBetaChunk = chunks.find((chunk) =>
      chunk.content.includes('beta'),
    );
    expect(firstBetaChunk?.content).toMatch(/^alpha/);
  });
});
