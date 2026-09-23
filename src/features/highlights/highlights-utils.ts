import { ApiError } from "../../lib/api/client";
import type { Highlight } from "../../lib/api/types";

export const HIGHLIGHTS_PAGE_SIZE = 20;

// Mengubah error daftar highlight menjadi pesan publik yang tidak membocorkan detail backend.
export function getHighlightListErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return "Highlight tidak dapat dimuat. Periksa koneksi lalu coba lagi.";
  if (error.status === 401) return "Sesi berakhir. Masuk kembali untuk melihat highlight.";
  if (error.status === 403) return "Kamu tidak memiliki izin untuk melihat highlight ini.";
  if (error.status === 404) return "Daftar highlight tidak ditemukan.";
  if (error.status >= 500) return "Layanan sedang mengalami kendala. Coba lagi beberapa saat.";
  return "Permintaan highlight tidak dapat diproses. Coba lagi.";
}

// Mengubah error mutation menjadi feedback singkat sesuai aksi yang gagal.
export function getHighlightMutationErrorMessage(error: unknown, action: "create" | "update" | "delete") {
  if (error instanceof ApiError && error.status === 401) return "Sesi berakhir. Masuk kembali untuk melanjutkan.";
  if (error instanceof ApiError && error.status === 403) return "Kamu tidak memiliki izin untuk mengubah highlight ini.";
  if (error instanceof ApiError && error.status === 404) return "Highlight atau artikel sumber sudah tidak tersedia.";
  if (action === "create") return "Highlight belum tersimpan. Coba lagi.";
  if (action === "update") return "Catatan belum tersimpan. Coba lagi.";
  return "Highlight belum terhapus. Coba lagi.";
}

// Menentukan judul artikel sumber dari field yang benar-benar dikembalikan API.
export function getHighlightArticleTitle(highlight: Highlight) {
  return highlight.article?.title?.trim() || "Buka artikel sumber";
}

// Menyediakan label tanggal yang tetap berguna ketika timestamp API tidak tersedia atau tidak valid.
export function getHighlightDate(value: string | null | undefined) {
  if (!value) return "Waktu tidak tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Waktu tidak tersedia";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

// Menyaring note kosong agar POST tidak mengirim field opsional yang tidak memiliki isi.
export function normalizeHighlightNote(value: string) {
  const note = value.trim();
  return note ? note : undefined;
}

// Membatasi page dari URL agar request collection tidak menerima angka negatif atau pecahan.
export function parseHighlightsPage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
