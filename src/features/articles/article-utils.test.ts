import { describe, expect, it } from "vitest";
import { ApiError } from "../../lib/api/client";
import {
  getExtractionErrorMessage,
  getExtractionStatusLabel,
  getSaveArticleErrorMessage,
  isRetryablePollingError,
  validateArticleUrl,
} from "./article-utils";

describe("article utilities", () => {
  it("menerima URL absolute HTTP dan HTTPS", () => {
    expect(validateArticleUrl(" https://example.com/read ")).toBeNull();
    expect(validateArticleUrl("http://example.com/read")).toBeNull();
  });

  it("menolak URL kosong, relative, dan protocol selain HTTP/HTTPS", () => {
    expect(validateArticleUrl("")).toBe("URL artikel wajib diisi.");
    expect(validateArticleUrl("/artikel")).toContain("URL absolut");
    expect(validateArticleUrl("ftp://example.com/file")).toContain("HTTP atau HTTPS");
  });

  it("menggunakan label status tanpa angka progress buatan", () => {
    expect(getExtractionStatusLabel("pending")).toBe("Menunggu proses");
    expect(getExtractionStatusLabel("processing")).toBe("Sedang menyiapkan artikel");
    expect(getExtractionStatusLabel("completed")).toBe("Artikel siap");
  });

  it("memetakan kode extraction ke pesan publik yang aman", () => {
    expect(getExtractionErrorMessage("FETCH_TIMEOUT")).toBe("Halaman sumber terlalu lama merespons.");
    expect(getExtractionErrorMessage("INTERNAL_STACK_TRACE")).toContain("belum berhasil");
  });

  it("hanya mengulang error polling yang bersifat sementara", () => {
    expect(isRetryablePollingError(new ApiError("not found", 404))).toBe(false);
    expect(isRetryablePollingError(new ApiError("server", 503))).toBe(true);
    expect(isRetryablePollingError(new TypeError("network"))).toBe(true);
  });

  it("tidak merender pesan internal API sebagai feedback save article", () => {
    expect(getSaveArticleErrorMessage(new ApiError("internal detail", 500))).toBe("Artikel tidak dapat disimpan. Coba lagi.");
  });
});
