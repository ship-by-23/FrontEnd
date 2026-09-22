import { describe, expect, it } from "vitest";
import { ApiError } from "../../lib/api/client";
import {
  clampReadingProgress,
  getReaderErrorMessage,
  getSafeReaderSourceUrl,
} from "./reader-utils";

describe("reader utilities", () => {
  it("membatasi progress pada rentang 0 sampai 100", () => {
    expect(clampReadingProgress(-10)).toBe(0);
    expect(clampReadingProgress(42.6)).toBe(43);
    expect(clampReadingProgress(120)).toBe(100);
  });

  it("hanya menerima sumber HTTP dan HTTPS", () => {
    expect(getSafeReaderSourceUrl("https://example.com/article")).toBe("https://example.com/article");
    expect(getSafeReaderSourceUrl("javascript:alert(1)")).toBeNull();
    expect(getSafeReaderSourceUrl("not-a-url")).toBeNull();
  });

  it("tidak merender pesan internal API sebagai error Reader", () => {
    expect(getReaderErrorMessage(new ApiError("internal detail", 500))).toBe("Artikel belum dapat dibuka. Coba lagi sebentar.");
    expect(getReaderErrorMessage(new ApiError("not found", 404))).toContain("tidak ditemukan");
  });
});
