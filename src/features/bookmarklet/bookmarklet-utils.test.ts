import { describe, expect, it } from "vitest";
import { buildSaveArticleUrl, createBookmarkletSource, getBookmarkletTargetUrl } from "./bookmarklet-utils";

describe("bookmarklet utilities", () => {
  const appOrigin = "https://app.example.test";
  const pageUrl = "https://publisher.example/article?utm_source=reader#section-2";

  it("membangun target internal Save Article", () => {
    expect(getBookmarkletTargetUrl(appOrigin)).toBe("https://app.example.test/articles/new");
  });

  it("mempertahankan URL halaman lengkap melalui parameter query", () => {
    const result = new URL(buildSaveArticleUrl(appOrigin, pageUrl));

    expect(result.pathname).toBe("/articles/new");
    expect(result.searchParams.get("url")).toBe(pageUrl);
  });

  it("menghasilkan source tanpa credential dan membaca URL saat bookmarklet dijalankan", () => {
    const source = createBookmarkletSource(appOrigin);

    expect(source.startsWith("javascript:")).toBe(true);
    expect(source).toContain("window.location.href");
    expect(source).toContain("encodeURIComponent");
    expect(source).not.toContain("password");
    expect(source).not.toContain("refreshToken");
    expect(source).not.toContain("accessToken");
  });
});
