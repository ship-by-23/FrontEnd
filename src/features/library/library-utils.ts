import { ApiError } from "../../lib/api/client";
import type { ArticleCollection, ArticleSummary, ReadingStatus, Tag } from "../../lib/api/types";
import type { ArticleUpdateInput } from "./library-api";

export const LIBRARY_PAGE_SIZE = 20;
export const DEFAULT_LIBRARY_VIEW = "grid" as const;
export const DEFAULT_LIBRARY_SORT = "createdAt" as const;

export const LIBRARY_SORT_OPTIONS = [
  { value: "createdAt", label: "Terbaru disimpan" },
  { value: "updatedAt", label: "Terbaru diperbarui" },
  { value: "title", label: "Judul A–Z" },
  { value: "readingProgress", label: "Progress baca" },
] as const;

export type LibraryView = "grid" | "list";
export type LibrarySort = (typeof LIBRARY_SORT_OPTIONS)[number]["value"];
export type LibraryFavoriteFilter = "all" | "favorite";
export type LibraryArchiveFilter = "all" | "active" | "archived";

export type LibraryUrlState = {
  view: LibraryView;
  status?: ReadingStatus;
  tagId?: string;
  favorite: LibraryFavoriteFilter;
  archived: LibraryArchiveFilter;
  sort: LibrarySort;
  query: string;
  page: number;
};

// Membatasi angka pagination agar URL yang rusak tidak menghasilkan request page negatif atau pecahan.
function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

// Memastikan nilai URL termasuk union yang diketahui tanpa menebak filter baru dari input eksternal.
function isReadingStatus(value: string | null): value is ReadingStatus {
  return value === "unread" || value === "reading" || value === "finished";
}

// Memastikan sort URL sesuai option yang benar-benar ditampilkan oleh UI.
function isLibrarySort(value: string | null): value is LibrarySort {
  return LIBRARY_SORT_OPTIONS.some((option) => option.value === value);
}

// Membaca state Library dari URL dan memberikan default stabil untuk parameter yang tidak ada.
export function parseLibrarySearchParams(searchParams: URLSearchParams): LibraryUrlState {
  const favoriteParam = searchParams.get("favorite");
  const archivedParam = searchParams.get("archived");
  const statusParam = searchParams.get("status");
  const sortParam = searchParams.get("sort");

  return {
    view: searchParams.get("view") === "list" ? "list" : DEFAULT_LIBRARY_VIEW,
    status: isReadingStatus(statusParam) ? statusParam : undefined,
    tagId: searchParams.get("tagId")?.trim() || undefined,
    favorite: favoriteParam === "true" ? "favorite" : "all",
    archived: archivedParam === "true" ? "archived" : archivedParam === "false" ? "active" : "all",
    sort: isLibrarySort(sortParam) ? sortParam : DEFAULT_LIBRARY_SORT,
    query: searchParams.get("query")?.trim() ?? "",
    page: parsePositiveInteger(searchParams.get("page"), 1),
  };
}

// Mengubah state URL menjadi parameter data yang membentuk query key dan request GET artikel.
export function toLibraryApiParams(state: LibraryUrlState) {
  return {
    page: state.page,
    pageSize: LIBRARY_PAGE_SIZE,
    status: state.status,
    tagId: state.tagId,
    favorite: state.favorite === "favorite" ? true : undefined,
    archived: state.archived === "all" ? undefined : state.archived === "archived",
    sort: state.sort,
    query: state.query || undefined,
  };
}

// Menentukan apakah filter yang tampil di URL sedang membatasi dataset Library.
export function hasActiveLibraryFilters(state: LibraryUrlState) {
  return Boolean(state.status || state.tagId || state.favorite !== "all" || state.archived !== "all" || state.query || state.sort !== DEFAULT_LIBRARY_SORT);
}

// Menentukan apakah artikel masih cocok pada filter lokal yang dapat dipastikan setelah optimistic update.
export function matchesLibraryFilters(article: ArticleSummary, state: LibraryUrlState) {
  if (state.status && article.readingStatus !== state.status) return false;
  if (state.tagId && !article.tags?.some((tag) => tag.id === state.tagId)) return false;
  if (state.favorite === "favorite" && !article.isFavorite) return false;
  if (state.archived === "active" && article.isArchived) return false;
  if (state.archived === "archived" && !article.isArchived) return false;
  return true;
}

// Menerapkan optimistic update pada cache aktif sambil menjaga pagination tetap masuk akal bila item keluar dari filter.
export function applyArticleUpdateToCollection(collection: ArticleCollection, articleId: string, input: ArticleUpdateInput, state: LibraryUrlState) {
  let removed = false;
  const data = collection.data.flatMap((article) => {
    if (article.id !== articleId) return [article];
    const updatedArticle = { ...article, ...input };
    if (!matchesLibraryFilters(updatedArticle, state)) {
      removed = true;
      return [];
    }
    return [updatedArticle];
  });

  if (!removed) return { ...collection, data };

  const totalItems = Math.max(0, collection.pagination.totalItems - 1);
  return {
    data,
    pagination: {
      ...collection.pagination,
      totalItems,
      totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / collection.pagination.pageSize),
    },
  };
}

// Menghapus satu artikel dari cache aktif setelah delete berhasil tanpa mengisi cache dengan data pengganti.
export function removeArticleFromCollection(collection: ArticleCollection, articleId: string) {
  const existed = collection.data.some((article) => article.id === articleId);
  if (!existed) return collection;

  const data = collection.data.filter((article) => article.id !== articleId);
  const totalItems = Math.max(0, collection.pagination.totalItems - 1);
  return {
    data,
    pagination: {
      ...collection.pagination,
      totalItems,
      totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / collection.pagination.pageSize),
    },
  };
}

// Mengubah error API menjadi pesan publik yang tidak membocorkan detail internal server.
export function getLibraryErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return "Pustaka tidak dapat dimuat. Periksa koneksi lalu coba lagi.";
  if (error.status === 401) return "Sesi berakhir. Masuk kembali untuk membuka library.";
  if (error.status === 403) return "Kamu tidak memiliki izin untuk melihat artikel ini.";
  if (error.status === 404) return "Data library tidak ditemukan.";
  if (error.status >= 500) return "Server sedang mengalami kendala. Coba lagi beberapa saat.";
  return "Permintaan library tidak dapat diproses. Coba lagi.";
}

// Mengubah error mutation menjadi feedback singkat yang dapat dipahami user.
export function getLibraryMutationErrorMessage(error: unknown, action: "update" | "delete") {
  if (error instanceof ApiError && error.status === 401) return "Sesi berakhir. Masuk kembali untuk melanjutkan.";
  if (error instanceof ApiError && error.status === 403) return "Kamu tidak memiliki izin untuk mengubah artikel ini.";
  return action === "delete" ? "Artikel tidak dapat dihapus. Coba lagi." : "Perubahan belum tersimpan. Coba lagi.";
}

// Menyediakan label status baca yang konsisten di badge, select, dan pesan aksesibel.
export function getReadingStatusLabel(status: ReadingStatus) {
  if (status === "reading") return "Sedang dibaca";
  if (status === "finished") return "Selesai";
  return "Belum dibaca";
}

// Menentukan label status ekstraksi yang tidak membuat angka progress palsu.
export function getExtractionStatusLabel(status: ArticleSummary["extractionStatus"]) {
  if (status === "pending") return "Menunggu ekstraksi";
  if (status === "processing") return "Sedang diekstrak";
  if (status === "failed") return "Ekstraksi gagal";
  return "Artikel siap";
}

// Memilih nama tag secara aman untuk membantu render label filter yang sedang aktif.
export function findTagName(tags: Tag[], tagId: string | undefined) {
  return tagId ? tags.find((tag) => tag.id === tagId)?.name ?? "Tag terpilih" : null;
}
