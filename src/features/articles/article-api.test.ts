import { describe, expect, it } from "vitest";
import { readArticleReference } from "./article-api";

describe("article API boundary", () => {
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
});
