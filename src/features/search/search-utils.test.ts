import { describe, expect, it } from "vitest";
import type { ArticleSummary } from "../../lib/api/types";
import {
  getSearchSnippet,
  hasActiveSearchFilters,
  parseSearchSearchParams,
  toSearchApiParams,
} from "./search-utils";

const article: ArticleSummary = {
  id: "article-1",
  title: "Artikel",
  readingStatus: "unread",
  isFavorite: false,
  isArchived: false,
  extractionStatus: "completed",
  createdAt: "2026-09-22T00:00:00.000Z",
};

describe("search URL and display utilities", () => {
  it("membaca q sebagai query Search dan mempertahankan filter Library", () => {
    const state = parseSearchSearchParams(new URLSearchParams("q=postgres&status=reading&tagId=tag-1&page=2"));

    expect(state.query).toBe("postgres");
    expect(state.status).toBe("reading");
    expect(state.tagId).toBe("tag-1");
    expect(toSearchApiParams(state)).toMatchObject({
      query: "postgres",
      status: "reading",
      tagId: "tag-1",
      page: 2,
    });
  });

  it("tidak mengirim query full-text untuk input kosong atau spasi", () => {
    const state = parseSearchSearchParams(new URLSearchParams("q=%20&page=-1"));

    expect(state.query).toBe("");
    expect(toSearchApiParams(state).query).toBeUndefined();
    expect(hasActiveSearchFilters(state)).toBe(false);
  });

  it("tetap dapat menjalankan daftar terpaginasikan ketika filter aktif tanpa query", () => {
    const state = parseSearchSearchParams(new URLSearchParams("status=finished"));

    expect(hasActiveSearchFilters(state)).toBe(true);
    expect(toSearchApiParams(state).status).toBe("finished");
  });

  it("mengembalikan snippet sebagai plain text dan mengabaikan nilai kosong", () => {
    expect(getSearchSnippet({ ...article, snippet: "  Teks cocok  " })).toBe("Teks cocok");
    expect(getSearchSnippet({ ...article, snippet: "   " })).toBeNull();
    expect(getSearchSnippet(article)).toBeNull();
  });
});
