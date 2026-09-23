import { ApiError } from "../../lib/api/client";
import type { ExtractionStatus } from "../../lib/api/types";

export const EXTRACTION_POLL_TIMEOUT_MS = 60_000;
export const EXTRACTION_POLL_INITIAL_DELAY_MS = 1_000;
export const EXTRACTION_POLL_MAX_DELAY_MS = 8_000;

// Memvalidasi bentuk URL dasar tanpa mengambil alih validasi keamanan yang menjadi tanggung jawab backend.
export function validateArticleUrl(input: string): string | null {
  const value = input.trim();
  if (!value) return "URL artikel wajib diisi.";

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "Gunakan URL dengan protocol HTTP atau HTTPS.";
    }
    return null;
  } catch {
    return "Masukkan URL absolut yang valid, misalnya https://contoh.com/artikel.";
  }
}

// Menentukan apakah extraction masih boleh dipantau oleh bounded polling.
export function isExtractionPending(status: ExtractionStatus | null | undefined): boolean {
  return status === "pending" || status === "processing";
}

// Mengubah status backend menjadi label aktivitas yang tidak mengandung progress palsu.
export function getExtractionStatusLabel(status: ExtractionStatus | null | undefined): string {
  if (status === "pending") return "Menunggu proses";
  if (status === "processing") return "Sedang menyiapkan artikel";
  if (status === "completed") return "Artikel siap";
  if (status === "failed") return "Artikel belum siap";
  return "Menyiapkan artikel";
}

// Menyediakan pesan aman untuk kode kegagalan extraction yang boleh diketahui user.
export function getExtractionErrorMessage(code: string | null | undefined): string {
  switch (code) {
    case "URL_BLOCKED":
      return "Alamat ini diblokir oleh kebijakan keamanan SimpanDulu.";
    case "FETCH_TIMEOUT":
      return "Halaman sumber terlalu lama merespons.";
    case "RESPONSE_TOO_LARGE":
      return "Halaman sumber terlalu besar untuk disiapkan.";
    case "UNSUPPORTED_CONTENT":
      return "Halaman sumber tidak berisi artikel yang bisa disimpan.";
    case "EXTRACTION_FAILED":
      return "Isi artikel tidak dapat diambil dari halaman sumber.";
    default:
      return "Artikel belum berhasil disiapkan. Kamu dapat mencoba lagi.";
  }
}

// Memetakan error API menjadi feedback publik tanpa merender detail internal server.
export function getSaveArticleErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "Layanan belum dapat dihubungi. Periksa koneksi lalu coba lagi.";
  if (error.fields?.url) return error.fields.url;

  switch (error.code) {
    case "URL_BLOCKED":
      return "Alamat ini diblokir oleh kebijakan keamanan SimpanDulu.";
    case "FETCH_TIMEOUT":
      return "Halaman sumber terlalu lama merespons.";
    case "RESPONSE_TOO_LARGE":
      return "Halaman sumber terlalu besar untuk disiapkan.";
    case "UNSUPPORTED_CONTENT":
      return "Halaman sumber tidak berisi artikel yang bisa disimpan.";
    case "EXTRACTION_FAILED":
      return "Isi artikel tidak dapat diambil. Kamu dapat mencoba lagi.";
    case "DUPLICATE_URL":
    case "ARTICLE_ALREADY_EXISTS":
      return "URL ini sudah ada di library. Gunakan artikel yang sudah tersimpan.";
    default:
      if (error.status === 401) return "Sesi berakhir. Masuk kembali untuk menyimpan artikel.";
      if (error.status === 403) return "Kamu tidak memiliki izin untuk menyimpan artikel ini.";
      if (error.status === 409) return "URL ini mungkin sudah ada di library. Periksa library sebelum mencoba lagi.";
      return "Artikel tidak dapat disimpan. Coba lagi.";
  }
}

// Memutuskan apakah error polling aman dicoba kembali selama batas waktu belum habis.
export function isRetryablePollingError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true;
  return error.status === 408 || error.status === 425 || error.status === 429 || error.status >= 500;
}
