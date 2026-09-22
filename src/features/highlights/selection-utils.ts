export type ReaderSelection = {
  quote: string;
  prefix: string;
  suffix: string;
  startOffset: number;
  endOffset: number;
  top: number;
  left: number;
};

// Menghitung offset teks relatif terhadap seluruh isi Reader tanpa mengubah DOM selection native.
function getBoundaryTextOffset(root: HTMLElement, container: Node, offset: number) {
  if (container !== root && !root.contains(container)) return null;

  try {
    const boundary = document.createRange();
    boundary.selectNodeContents(root);
    boundary.setEnd(container, offset);
    return boundary.toString().length;
  } catch {
    return null;
  }
}

// Mengambil selection yang benar-benar berada di artikel dan mengubahnya menjadi payload highlight.
export function getReaderSelection(root: HTMLElement): ReaderSelection | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;

  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;

  const rawQuote = selection.toString();
  const quote = rawQuote.trim();
  if (!quote) return null;

  const rawStartOffset = getBoundaryTextOffset(root, range.startContainer, range.startOffset);
  const rawEndOffset = getBoundaryTextOffset(root, range.endContainer, range.endOffset);
  if (rawStartOffset === null || rawEndOffset === null || rawEndOffset <= rawStartOffset) return null;

  const leadingWhitespace = rawQuote.length - rawQuote.trimStart().length;
  const trailingWhitespace = rawQuote.length - rawQuote.trimEnd().length;
  const startOffset = rawStartOffset + leadingWhitespace;
  const endOffset = rawEndOffset - trailingWhitespace;
  const readerText = root.textContent ?? "";
  const rect = range.getBoundingClientRect();

  return {
    quote,
    prefix: readerText.slice(Math.max(0, startOffset - 80), startOffset),
    suffix: readerText.slice(endOffset, endOffset + 80),
    startOffset,
    endOffset,
    top: rect.top,
    left: rect.left + rect.width / 2,
  };
}
