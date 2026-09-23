import { ApiError } from "../../lib/api/client";

export const TAG_ARTICLES_PAGE_SIZE = 20;

// Memvalidasi input dasar tanpa menduplikasi aturan normalisasi yang menjadi otoritas backend.
export function validateTagName(input: string): string | null {
  if (!input.trim()) return "Nama tag wajib diisi.";
  return null;
}

// Mengubah error list tag menjadi pesan publik yang tidak membocorkan detail server.
export function getTagListErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "Tag tidak dapat dimuat. Periksa koneksi lalu coba lagi.";
  if (error.status === 401) return "Sesi berakhir. Masuk kembali untuk melihat tag.";
  if (error.status === 403) return "Kamu tidak memiliki izin untuk melihat tag ini.";
  if (error.status >= 500) return "Layanan sedang mengalami kendala. Coba lagi beberapa saat.";
  return "Tag tidak dapat dimuat. Coba lagi.";
}

// Mengubah error mutation Tags menjadi feedback yang sesuai dengan aksi user.
export function getTagMutationErrorMessage(error: unknown, action: "create" | "rename" | "delete" | "attach" | "detach"): string {
  if (!(error instanceof ApiError)) return "Layanan belum dapat dihubungi. Periksa koneksi lalu coba lagi.";
  if (error.fields?.name) return error.fields.name;

  const normalizedCode = error.code.toUpperCase();
  if (error.status === 409 || normalizedCode.includes("DUPLICATE") || normalizedCode.includes("CONFLICT") || normalizedCode.includes("EXISTS")) {
    return "Nama tag tersebut sudah digunakan. Gunakan nama lain.";
  }
  if (error.status === 401) return "Sesi berakhir. Masuk kembali untuk melanjutkan.";
  if (error.status === 403) return "Kamu tidak memiliki izin untuk mengubah tag ini.";
  if (error.status === 404) return action === "delete" || action === "rename" ? "Tag tidak ditemukan atau sudah dihapus." : "Artikel atau tag tidak ditemukan.";
  if (error.status >= 500) return "Layanan sedang mengalami kendala. Coba lagi beberapa saat.";

  if (action === "create") return "Tag belum dapat dibuat. Periksa nama lalu coba lagi.";
  if (action === "rename") return "Nama tag belum dapat diubah. Coba lagi.";
  if (action === "delete") return "Tag belum dapat dihapus. Coba lagi.";
  if (action === "attach") return "Tag belum dapat dipasang ke artikel. Coba lagi.";
  return "Tag belum dapat dilepas dari artikel. Coba lagi.";
}

// Membaca nomor halaman dari URL dengan fallback aman untuk nilai yang tidak valid.
export function parseTagPage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
