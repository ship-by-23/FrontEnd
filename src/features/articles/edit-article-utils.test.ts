import { describe, expect, it } from "vitest";
import { ApiError } from "../../lib/api/client";
import type { Article } from "../../lib/api/types";
import {
  getEditArticleLoadErrorMessage,
  getInitialEditArticleValues,
  getEditArticleMutationErrorMessage,
  toArticleUpdateInput,
  validateEditArticleValues,
} from "./edit-article-utils";

const article: Article = {
  id: "article-1",
  title: "Artikel API",
  description: "Deskripsi artikel",
  siteName: "SimpanDulu",
  author: "Penulis",
  imageUrl: null,
  estimatedReadingMinutes: 5,
  readingStatus: "reading",
  readingProgress: 40,
  readingAnchor: null,
  isFavorite: true,
  isArchived: false,
  extractionStatus: "completed",
  extractionErrorCode: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  submittedUrl: "https://example.com/article",
  canonicalUrl: "https://example.com/article",
  publishedAt: null,
  contentHtml: "<p>Artikel</p>",
  contentText: "Artikel",
  wordCount: 1,
  finishedAt: null,
  tags: [{ id: "tag-1", name: "API" }],
};

describe("edit article utilities", () => {
  it("mengambil hanya state user-controlled sebagai draft edit", () => {
    expect(getInitialEditArticleValues(article)).toEqual({
      readingStatus: "reading",
      isFavorite: true,
      isArchived: false,
      tagIds: ["tag-1"],
    });
  });

  it("tidak memasukkan metadata extraction atau tags ke payload PATCH", () => {
    expect(toArticleUpdateInput({
      readingStatus: "finished",
      isFavorite: false,
      isArchived: true,
      tagIds: ["tag-1", "tag-2"],
    })).toEqual({
      readingStatus: "finished",
      isFavorite: false,
      isArchived: true,
    });
  });

  it("menolak status baca yang tidak termasuk enum produk", () => {
    expect(validateEditArticleValues({
      readingStatus: "invalid" as Article["readingStatus"],
      isFavorite: false,
      isArchived: false,
      tagIds: [],
    })).toBe("Pilih status baca yang tersedia.");
  });

  it("memetakan error load dan mutation ke pesan publik", () => {
    expect(getEditArticleLoadErrorMessage(new ApiError("internal", 404))).toContain("tidak ditemukan");
    expect(getEditArticleMutationErrorMessage(new ApiError("internal", 403), "update")).toContain("tidak memiliki izin");
    expect(getEditArticleMutationErrorMessage(new ApiError("internal", 500), "delete")).toContain("tidak dapat dihapus");
  });
});
