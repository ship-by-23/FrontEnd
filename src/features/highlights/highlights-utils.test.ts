import { describe, expect, it } from "vitest";
import { ApiError } from "../../lib/api/client";
import type { Highlight } from "../../lib/api/types";
import {
  getHighlightArticleTitle,
  getHighlightMutationErrorMessage,
  normalizeHighlightNote,
  parseHighlightsPage,
} from "./highlights-utils";

const highlight: Highlight = {
  id: "highlight-1",
  articleId: "article-1",
  quote: "Kutipan penting",
  createdAt: "2026-09-22T10:00:00.000Z",
};

describe("highlight utilities", () => {
  it("menghapus note kosong agar field opsional tidak dikirim", () => {
    expect(normalizeHighlightNote("  ")).toBeUndefined();
    expect(normalizeHighlightNote("  Catatan  ")).toBe("Catatan");
  });

  it("membaca referensi artikel tanpa membuat judul dummy", () => {
    expect(getHighlightArticleTitle(highlight)).toBe("Buka artikel sumber");
    expect(getHighlightArticleTitle({ ...highlight, article: { id: "article-1", title: "Artikel API" } })).toBe("Artikel API");
  });

  it("mengembalikan page aman dari URL yang tidak valid", () => {
    expect(parseHighlightsPage(null)).toBe(1);
    expect(parseHighlightsPage("0")).toBe(1);
    expect(parseHighlightsPage("abc")).toBe(1);
    expect(parseHighlightsPage("2")).toBe(2);
  });

  it("menggunakan pesan mutation yang tidak membocorkan detail server", () => {
    expect(getHighlightMutationErrorMessage(new ApiError("internal", 500), "update")).toBe("Catatan belum tersimpan. Coba lagi.");
  });
});
