import { apiRequest } from "../../lib/api/client";
import type { ArticleCollection, ArticleSummary, ReadingStatus } from "../../lib/api/types";

export type LibraryApiParams = {
  page: number;
  pageSize: number;
  status?: ReadingStatus;
  tagId?: string;
  favorite?: boolean;
  archived?: boolean;
  sort?: string;
  query?: string;
};

export type ArticleUpdateInput = Partial<Pick<ArticleSummary, "readingStatus" | "isFavorite" | "isArchived">>;

// Mengubah parameter Library menjadi query string API tanpa mengirim state view yang hanya berpengaruh pada rendering.
function toArticleQuery(params: LibraryApiParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });

  if (params.status) query.set("status", params.status);
  if (params.tagId) query.set("tagId", params.tagId);
  if (params.favorite !== undefined) query.set("favorite", String(params.favorite));
  if (params.archived !== undefined) query.set("archived", String(params.archived));
  if (params.sort) query.set("sort", params.sort);
  if (params.query) query.set("query", params.query);

  return query;
}

// Mengambil ringkasan artikel terpaginasikan untuk satu kombinasi filter Library.
export function getLibraryArticles(params: LibraryApiParams, signal?: AbortSignal) {
  return apiRequest<ArticleCollection>("/articles?" + toArticleQuery(params).toString(), { signal });
}

// Memperbarui field artikel yang memang dikontrol user tanpa membuat endpoint frontend baru.
export function updateArticle(articleId: string, input: ArticleUpdateInput) {
  return apiRequest<unknown>("/articles/" + encodeURIComponent(articleId), {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

// Menghapus artikel secara permanen setelah user melewati confirmation dialog.
export function deleteArticle(articleId: string) {
  return apiRequest<unknown>("/articles/" + encodeURIComponent(articleId), { method: "DELETE" });
}
