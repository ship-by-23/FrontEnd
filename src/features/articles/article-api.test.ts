import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "../../lib/api/client";
import { markArticleFinished, readArticleReference, saveReadingProgress } from "./article-api";

vi.mock("../../lib/api/client", () => ({ apiRequest: vi.fn() }));

const finishedArticleResponse = {
  data: {
    id: "article-1",
    submittedUrl: "https://example.com/article",
    title: "Artikel",
    readingStatus: "finished",
    readingProgress: 100,
    isFavorite: false,
    isArchived: false,
    extractionStatus: "completed",
    createdAt: "2026-09-23T00:00:00.000Z",
  },
};

describe("article API boundary", () => {
  beforeEach(() => vi.mocked(apiRequest).mockReset());

  it("membaca articleId dari response queued yang terdokumentasi", () => {
    expect(readArticleReference({ articleId: "article-1", extractionStatus: "pending" })).toEqual({
      articleId: "article-1",
      extractionStatus: "pending",
    });
  });

  it("mendukung response article langsung dan envelope data", () => {
    expect(readArticleReference({ id: "article-2", extractionStatus: "processing" })).toEqual({
      articleId: "article-2",
      extractionStatus: "processing",
    });
    expect(readArticleReference({ data: { id: "article-3", extractionStatus: "completed" } })).toEqual({
      articleId: "article-3",
      extractionStatus: "completed",
    });
  });

  it("tidak membuat ID ketika response tidak menyediakan referensi artikel", () => {
    expect(readArticleReference(undefined)).toBeNull();
    expect(readArticleReference({ extractionStatus: "pending" })).toBeNull();
  });

  it("mengubah nama field progress UI ke kontrak request backend", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce(undefined);

    await saveReadingProgress("article/1", { readingProgress: 42, readingAnchor: "paragraph-2" });

    expect(apiRequest).toHaveBeenCalledWith("/articles/article%2F1/progress", {
      method: "PUT",
      body: JSON.stringify({ progress: 42, anchor: "paragraph-2" }),
    });
  });

  it("menandai selesai hanya dengan field yang diterima endpoint artikel", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce(finishedArticleResponse);

    await markArticleFinished("article-1");

    expect(apiRequest).toHaveBeenCalledWith("/articles/article-1", {
      method: "PATCH",
      body: JSON.stringify({ readingStatus: "finished" }),
    });
  });
});
