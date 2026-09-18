export type MarkdownChunk = {
  index: number;
  content: string;
  heading: string | null;
};

const splitLongBlock = (block: string, maxLength: number): string[] => {
  if (block.length <= maxLength) return [block];
  const sentences = block.split(/(?<=[.?!])\s+/);
  const parts: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const words =
      sentence.length > maxLength ? sentence.split(/\s+/) : [sentence];
    for (const word of words) {
      if (!current) {
        current = word;
      } else if (`${current} ${word}`.length <= maxLength) {
        current += ` ${word}`;
      } else {
        parts.push(current);
        current = word;
      }
      while (current.length > maxLength) {
        parts.push(current.slice(0, maxLength));
        current = current.slice(maxLength);
      }
    }
  }
  if (current) parts.push(current);
  return parts;
};

const overlapFrom = (content: string) => {
  const tail = content.slice(-100);
  const firstSpace = tail.indexOf(' ');
  return (firstSpace >= 0 ? tail.slice(firstSpace + 1) : tail).trim();
};

export const chunkMarkdown = (markdown: string): MarkdownChunk[] => {
  const text = markdown.replace(/\r\n?/g, '\n').trim();
  if (!text) return [];

  const sections: Array<{ heading: string | null; body: string }> = [];
  let heading: string | null = null;
  let lines: string[] = [];
  const flush = () => {
    if (lines.some((line) => line.trim())) {
      sections.push({ heading, body: lines.join('\n') });
    }
  };

  for (const line of text.split('\n')) {
    if (/^#{1,6}[ \t].+/.test(line)) {
      flush();
      heading = line;
      lines = [line];
    } else {
      lines.push(line);
    }
  }
  flush();

  const baseChunks: Array<{ content: string; heading: string | null }> = [];
  for (const section of sections) {
    const blocks = section.body
      .split(/\n\n+/)
      .map((block) => block.trim())
      .filter(Boolean)
      .flatMap((block) => splitLongBlock(block, 699));
    let current = '';
    for (const block of blocks) {
      if (!current) current = block;
      else if (`${current}\n\n${block}`.length <= 699) {
        current += `\n\n${block}`;
      } else {
        baseChunks.push({ content: current, heading: section.heading });
        current = block;
      }
    }
    if (current)
      baseChunks.push({ content: current, heading: section.heading });
  }

  return baseChunks.map((chunk, index) => {
    if (index === 0) return { ...chunk, index };
    const overlap = overlapFrom(baseChunks[index - 1].content);
    return {
      index,
      heading: chunk.heading,
      content: overlap ? `${overlap}\n${chunk.content}`.trim() : chunk.content,
    };
  });
};
