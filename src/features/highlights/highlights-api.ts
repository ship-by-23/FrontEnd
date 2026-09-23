import { apiRequest } from "../../lib/api/client";
import type { Highlight, Pagination } from "../../lib/api/types";

export type HighlightCollection = Highlight[] | {
  data: Highlight[];
  pagination?: Pagination;
};

export type CreateHighlightInput = {
  quote: string;
  prefix?: string;
  suffix?: string;
  startOffset: number;
  endOffset: number;
  note?: string;
};

export type UpdateHighlightInput = {
  note: string | null;
};

// Mengambil seluruh highlight user dengan pagination yang kompatibel dengan collection API SimpanDulu.
export function getHighlights(page: number, pageSize: number, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return apiRequest<HighlightCollection>(`/highlights?${params.toString()}`, { signal });
}

// Mengambil highlight yang terhubung dengan artikel Reader aktif.
export function getArticleHighlights(articleId: string, signal?: AbortSignal) {
  return apiRequest<HighlightCollection>(`/articles/${encodeURIComponent(articleId)}/highlights`, { signal });
}

// Membuat highlight dengan quote, konteks, offset, dan note opsional dari selection Reader.
export function createHighlight(articleId: string, input: CreateHighlightInput) {
  return apiRequest<Highlight>(`/articles/${encodeURIComponent(articleId)}/highlights`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// Mengubah note highlight tanpa mengarang field lain yang belum didukung contract backend.
export function updateHighlight(highlightId: string, input: UpdateHighlightInput) {
  return apiRequest<Highlight>(`/highlights/${encodeURIComponent(highlightId)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

// Menghapus highlight setelah user mengonfirmasi tindakan tersebut.
export function deleteHighlight(highlightId: string) {
  return apiRequest<unknown>(`/highlights/${encodeURIComponent(highlightId)}`, { method: "DELETE" });
}

// Menormalkan response collection tanpa membuat item pengganti ketika API mengembalikan daftar kosong.
export function unwrapHighlights(response: HighlightCollection): { data: Highlight[]; pagination?: Pagination } {
  return Array.isArray(response) ? { data: response } : response;
}
