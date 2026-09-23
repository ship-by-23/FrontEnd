import { ApiError } from "../../lib/api/client";
import type { ArticleSummary } from "../../lib/api/types";
import {
  DEFAULT_LIBRARY_SORT,
  parseLibrarySearchParams,
  toLibraryApiParams,
  type LibraryUrlState,
} from "../library/library-utils";

export type SearchUrlState = LibraryUrlState;

// Membaca query Search dari q atau query sambil mempertahankan parser filter Library yang sudah ada.
export function parseSearchSearchParams(searchParams: URLSearchParams): SearchUrlState {
  const normalizedParams = new URLSearchParams(searchParams);
  if (!normalizedParams.has("query") && normalizedParams.has("q")) {
    normalizedParams.set("query", normalizedParams.get("q") ?? "");
  }
  return parseLibrarySearchParams(normalizedParams);
}

// Mengubah state URL Search menjadi parameter API artikel tanpa mengirim state visual ke backend.
export function toSearchApiParams(state: SearchUrlState) {
  return toLibraryApiParams(state);
}

// Menentukan apakah ada filter selain query yang perlu menjalankan daftar artikel terpaginasikan.
export function hasActiveSearchFilters(state: SearchUrlState) {
  return Boolean(
    state.status
      || state.tagId
      || state.favorite !== "all"
      || state.archived !== "all"
      || state.sort !== DEFAULT_LIBRARY_SORT,
  );
}

// Mengubah error Search menjadi pesan publik tanpa membocorkan detail internal API.
export function getSearchErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return "Pencarian tidak dapat dimuat. Periksa koneksi lalu coba lagi.";
  if (error.status === 401) return "Sesi berakhir. Masuk kembali untuk mencari artikel.";
  if (error.status === 403) return "Kamu tidak memiliki izin untuk mencari artikel ini.";
  if (error.status === 404) return "Data pencarian tidak ditemukan.";
  if (error.status >= 500) return "Layanan sedang mengalami kendala. Coba lagi beberapa saat.";
  return "Permintaan pencarian tidak dapat diproses. Coba lagi.";
}

// Mengambil snippet sebagai plain text sehingga isi dari API tidak pernah diperlakukan sebagai HTML.
export function getSearchSnippet(article: ArticleSummary) {
  const snippet = article.snippet?.trim();
  return snippet || null;
}
