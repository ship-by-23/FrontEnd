import { describe, expect, it } from "vitest";
import {
  ApiContractError,
  parseArticleCollection,
  parseArticleResponse,
  parseHighlightCollection,
  parseTagCollection,
  parseUserResponse,
} from "./contracts";

const articleSummary = {
  id: "article-1",
  title: "Artikel nyata dari API",
  description: null,
  readingStatus: "unread",
  readingProgress: 0,
  isFavorite: false,
  isArchived: false,
  extractionStatus: "completed",
  createdAt: "2026-09-23T00:00:00.000Z",
};

describe("API runtime contracts", () => {
  it("membaca user dari envelope data", () => {
    expect(parseUserResponse({ data: { id: "user-1", name: "Ari", email: "ari@example.com", role: "user" } })).toEqual({
      id: "user-1",
      name: "Ari",
      email: "ari@example.com",
      role: "user",
    });
  });

  it("menolak article summary yang kehilangan field wajib", () => {
    expect(() => parseArticleCollection({
      data: [{ id: "article-1", readingStatus: "unread" }],
      pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    })).toThrow(ApiContractError);
  });

  it("membaca collection kosong tanpa mengisi item pengganti", () => {
    expect(parseArticleCollection({
      data: [],
      pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
    })).toEqual({
      data: [],
      pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
    });
  });

  it("membaca detail article dan collection tag sesuai contract", () => {
    expect(parseArticleResponse({ data: { ...articleSummary, submittedUrl: "https://example.com/article", contentHtml: "<p>Isi</p>" } }).contentHtml).toBe("<p>Isi</p>");
    expect(parseTagCollection([{ id: "tag-1", name: "Belajar" }])).toEqual([{ id: "tag-1", name: "Belajar" }]);
  });

  it("mempertahankan highlight dan referensi artikel sumber", () => {
    expect(parseHighlightCollection({
      data: [{
        id: "highlight-1",
        articleId: "article-1",
        quote: "Kalimat penting",
        note: null,
        createdAt: "2026-09-23T00:00:00.000Z",
        article: { id: "article-1", title: "Artikel nyata dari API" },
      }],
      pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    }).data[0].article).toEqual({ id: "article-1", title: "Artikel nyata dari API", siteName: null });
  });
});
