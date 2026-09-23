import { ApiError } from "../../lib/api/client";
import type { Article, ReadingStatus } from "../../lib/api/types";
import type { ArticleUpdateInput } from "../library/library-api";

export type EditArticleValues = {
  readingStatus: ReadingStatus;
  isFavorite: boolean;
  isArchived: boolean;
  tagIds: string[];
};

// Membentuk draft edit dari state artikel yang benar-benar dikembalikan API.
export function getInitialEditArticleValues(article: Article): EditArticleValues {
  return {
    readingStatus: article.readingStatus,
    isFavorite: article.isFavorite,
    isArchived: article.isArchived,
    tagIds: article.tags?.map((tag) => tag.id) ?? [],
  };
}

// Membatasi payload PATCH pada field state yang sudah didukung contract frontend saat ini.
export function toArticleUpdateInput(values: EditArticleValues): ArticleUpdateInput {
  return {
    readingStatus: values.readingStatus,
    isFavorite: values.isFavorite,
    isArchived: values.isArchived,
  };
}

// Memastikan nilai status yang datang dari kontrol form tetap berada pada enum produk.
export function isValidReadingStatus(value: string): value is ReadingStatus {
  return value === "unread" || value === "reading" || value === "finished";
}

// Menolak draft yang tidak valid sebelum request PATCH dikirim ke backend.
export function validateEditArticleValues(values: EditArticleValues): string | null {
  return isValidReadingStatus(values.readingStatus) ? null : "Pilih status baca yang tersedia.";
}

// Mengubah error GET detail artikel menjadi pesan publik dengan jalan kembali yang jelas.
export function getEditArticleLoadErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "Artikel tidak dapat dimuat. Periksa koneksi lalu coba lagi.";
  if (error.status === 401) return "Sesi berakhir. Masuk kembali untuk mengedit artikel.";
  if (error.status === 403) return "Kamu tidak memiliki izin untuk mengedit artikel ini.";
  if (error.status === 404) return "Artikel tidak ditemukan atau sudah tidak tersedia.";
  if (error.status === 408 || error.status === 429 || error.status >= 500) return "Artikel belum dapat dimuat. Coba lagi sebentar.";
  return "Artikel tidak dapat dimuat. Coba lagi.";
}

// Mengubah error mutation artikel menjadi feedback singkat tanpa membocorkan detail server.
export function getEditArticleMutationErrorMessage(error: unknown, action: "update" | "delete"): string {
  if (!(error instanceof ApiError)) return "Server belum dapat dihubungi. Periksa koneksi lalu coba lagi.";
  if (error.status === 401) return "Sesi berakhir. Masuk kembali untuk melanjutkan.";
  if (error.status === 403) return "Kamu tidak memiliki izin untuk mengubah artikel ini.";
  if (error.status === 404) return "Artikel tidak ditemukan atau sudah tidak tersedia.";
  if (error.status >= 500) return action === "delete" ? "Artikel tidak dapat dihapus. Coba lagi." : "Server sedang mengalami kendala. Coba lagi beberapa saat.";
  return action === "delete" ? "Artikel tidak dapat dihapus. Coba lagi." : "Perubahan belum tersimpan. Coba lagi.";
}
