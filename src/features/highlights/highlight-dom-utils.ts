import type { Highlight } from "../../lib/api/types";

type TextNodeRange = {
  node: Text;
  start: number;
  end: number;
};

// Mengambil text node artikel tanpa menganggap markup HTML sebagai bagian dari quote.
function getTextNodeRanges(root: HTMLElement): TextNodeRange[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const ranges: TextNodeRange[] = [];
  let cursor = 0;
  let currentNode = walker.nextNode();

  while (currentNode) {
    const node = currentNode as Text;
    const parent = node.parentElement;
    const end = cursor + node.data.length;
    if (parent && parent.closest("script, style")) {
      cursor = end;
      currentNode = walker.nextNode();
      continue;
    }

    ranges.push({ node, start: cursor, end });
    cursor = end;
    currentNode = walker.nextNode();
  }

  return ranges;
}

// Melepaskan mark highlight lama sebelum React atau query baru menerapkan state yang lebih mutakhir.
export function clearHighlightMarks(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>("mark[data-highlight-id]").forEach((mark) => {
    if (!mark.isConnected || !mark.parentNode) return;
    mark.replaceWith(document.createTextNode(mark.textContent ?? ""));
  });
  root.normalize();
}

// Memilih offset quote yang paling konsisten dengan context ketika offset backend tidak lagi cocok.
function resolveHighlightOffsets(root: HTMLElement, highlight: Highlight) {
  const text = root.textContent ?? "";
  const quote = highlight.quote;
  if (!quote) return null;

  const storedStart = highlight.startOffset ?? -1;
  if (storedStart >= 0 && text.slice(storedStart, storedStart + quote.length) === quote) {
    return { start: storedStart, end: storedStart + quote.length };
  }

  let candidateStart = text.indexOf(quote);
  let best: { start: number; end: number; score: number } | null = null;
  while (candidateStart >= 0) {
    const end = candidateStart + quote.length;
    let score = 0;
    if (highlight.prefix && text.slice(Math.max(0, candidateStart - highlight.prefix.length), candidateStart).endsWith(highlight.prefix)) score += 1;
    if (highlight.suffix && text.slice(end, end + highlight.suffix.length).startsWith(highlight.suffix)) score += 1;
    if (!best || score > best.score) best = { start: candidateStart, end, score };
    candidateStart = text.indexOf(quote, candidateStart + 1);
  }

  return best ? { start: best.start, end: best.end } : null;
}

// Menerapkan mark visual pada quote tanpa mengganti isi artikel atau mematikan native selection.
function wrapHighlightRange(root: HTMLElement, highlight: Highlight, start: number, end: number) {
  const ranges = getTextNodeRanges(root);
  for (const textRange of ranges.slice().reverse()) {
    const localStart = Math.max(start, textRange.start) - textRange.start;
    const localEnd = Math.min(end, textRange.end) - textRange.start;
    if (localStart >= localEnd) continue;

    const range = document.createRange();
    range.setStart(textRange.node, localStart);
    range.setEnd(textRange.node, localEnd);
    const mark = document.createElement("mark");
    mark.className = "reader-highlight-mark";
    mark.dataset.highlightId = highlight.id;
    mark.title = highlight.note ? `Highlight dengan catatan: ${highlight.note}` : "Highlight tersimpan";
    mark.setAttribute("aria-label", `Highlight: ${highlight.quote}`);
    range.surroundContents(mark);
  }
}

// Menandai seluruh highlight yang dapat dipulihkan dari quote atau offset yang tersedia.
export function applyHighlightMarks(root: HTMLElement, highlights: Highlight[]) {
  clearHighlightMarks(root);
  const orderedHighlights = [...highlights].sort((left, right) => (left.startOffset ?? Number.MAX_SAFE_INTEGER) - (right.startOffset ?? Number.MAX_SAFE_INTEGER));
  orderedHighlights.forEach((highlight) => {
    const offsets = resolveHighlightOffsets(root, highlight);
    if (offsets) wrapHighlightRange(root, highlight, offsets.start, offsets.end);
  });
}
