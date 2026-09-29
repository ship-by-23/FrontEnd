import { describe, expect, it } from "vitest";
import {
  getHighlightSelectionForSubmit,
  type ReaderSelection,
} from "./selection-utils";

function createSelection(quote: string, startOffset: number): ReaderSelection {
  return {
    quote,
    prefix: "",
    suffix: "",
    startOffset,
    endOffset: startOffset + quote.length,
    top: 100,
    left: 200,
  };
}

describe("getHighlightSelectionForSubmit", () => {
  it("mempertahankan snapshot ketika dialog membuat selection browser hilang", () => {
    const pending = createSelection("kutipan jurnal", 12);
    expect(getHighlightSelectionForSubmit(pending, null)).toBe(pending);
  });

  it("menggunakan selection aktif ketika dialog belum memiliki snapshot", () => {
    const current = createSelection("kutipan artikel", 4);
    expect(getHighlightSelectionForSubmit(null, current)).toBe(current);
  });

  it("mengembalikan null ketika tidak ada selection yang valid", () => {
    expect(getHighlightSelectionForSubmit(null, null)).toBeNull();
  });
});
