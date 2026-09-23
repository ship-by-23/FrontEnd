import { describe, expect, it } from "vitest";
import type { ArticleCollection, ArticleSummary } from "../../lib/api/types";
import {
  applyArticleUpdateToCollection,
  parseLibrarySearchParams,
  removeArticleFromCollection,
  toLibraryApiParams,
} from "./library-utils";

const article: ArticleSummary = {
  id: "article-1",
  title: "Artikel pertama",
  description: "Deskripsi",
  siteName: "SimpanDulu",
  imageUrl: null,
  readingStatus: "unread",
  readingProgress: 0,
  isFavorite: false,
  isArchived: false,
  extractionStatus: "completed",
  createdAt: "2026-09-22T00:00:00.000Z",
  tags: [{ id: "tag-1", name: "Belajar" }],
};

const collection: ArticleCollection = {
  data: [article],
  pagination: { page: 2, pageSize: 20, totalItems: 21, totalPages: 2 },
};

describe("library URL and cache utilities", () => {
  it("membaca kombinasi filter dan view dari URL", () => {
    const state = parseLibrarySearchParams(new URLSearchParams("status=reading&favorite=true&archived=false&tagId=tag-1&view=list&sort=title&page=3&query=react"));

    expect(state).toEqual({
      view: "list",
      status: "reading",
      tagId: "tag-1",
      favorite: "favorite",
      archived: "active",
      sort: "title",
      query: "react",
      page: 3,
    });
    expect(toLibraryApiParams(state)).toEqual({
      page: 3,
      pageSize: 20,
      status: "reading",
      tagId: "tag-1",
      favorite: true,
      archived: false,
      sort: "title",
      query: "react",
    });
  });

  it("mengabaikan query kosong agar tidak menjalankan full-text query tanpa batas", () => {
    const state = parseLibrarySearchParams(new URLSearchParams("query=%20&status=unknown&page=-1"));
    expect(state.query).toBe("");
    expect(state.status).toBeUndefined();
    expect(state.page).toBe(1);
    expect(toLibraryApiParams(state).query).toBeUndefined();
  });

  it("memakai preference lokal sebagai default view ketika URL belum menentukan view", () => {
    expect(parseLibrarySearchParams(new URLSearchParams(), "list").view).toBe("list");
    expect(parseLibrarySearchParams(new URLSearchParams("view=grid"), "list").view).toBe("grid");
  });

  it("menghapus item dari cache ketika optimistic status tidak lagi cocok dengan filter", () => {
    const state = parseLibrarySearchParams(new URLSearchParams("status=unread"));
    const updated = applyArticleUpdateToCollection(collection, article.id, { readingStatus: "finished" }, state);

    expect(updated.data).toHaveLength(0);
    expect(updated.pagination.totalItems).toBe(20);
    expect(updated.pagination.totalPages).toBe(1);
  });

  it("menghapus artikel dari cache tanpa membuat data pengganti", () => {
    const updated = removeArticleFromCollection(collection, article.id);

    expect(updated.data).toEqual([]);
    expect(updated.pagination.totalItems).toBe(20);
    expect(updated.pagination.totalPages).toBe(1);
  });
});
