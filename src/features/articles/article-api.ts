import { apiRequest } from "../../lib/api/client";
import type { Article, ExtractionStatus, Tag } from "../../lib/api/types";

export type ArticleResponse = Article | { data: Article };

export type CreateArticleInput = {
  url: string;
  tagIds?: string[];
};

export type ArticleReference = {
  articleId: string;
  extractionStatus?: ExtractionStatus;
};

export type TagCollection = Tag[] | { data: Tag[] };

// Mengirim URL dan tag yang dipilih ke endpoint artikel tanpa membuat endpoint UI baru.
export function createArticle(input: CreateArticleInput) {
  const body = input.tagIds && input.tagIds.length > 0 ? input : { url: input.url };
  return apiRequest<unknown>("/articles", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Mengambil detail artikel untuk memantau lifecycle extraction dari sumber backend.
export function getArticle(articleId: string, signal?: AbortSignal) {
  return apiRequest<ArticleResponse>(`/articles/${encodeURIComponent(articleId)}`, { signal });
}

// Mengulangi extraction artikel yang sebelumnya gagal secara idempotent di boundary API.
export function retryArticle(articleId: string) {
  return apiRequest<unknown>(`/articles/${encodeURIComponent(articleId)}/retry`, { method: "POST" });
}

// Mengambil tag milik user aktif untuk selector opsional pada form simpan artikel.
export function getTags(signal?: AbortSignal) {
  return apiRequest<TagCollection>("/tags", { signal });
}

// Menormalkan response detail artikel yang dapat menggunakan envelope data atau object langsung.
export function unwrapArticle(response: ArticleResponse): Article {
  return "data" in response ? response.data : response;
}

// Menormalkan response tag tanpa membuat fallback data ketika database kosong.
export function unwrapTags(response: TagCollection): Tag[] {
  return Array.isArray(response) ? response : response.data;
}

// Memastikan nilai tidak null dan dapat dibaca sebagai object tanpa memakai any.
function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}

// Memastikan status response sesuai union extraction yang disepakati backend.
function isExtractionStatus(value: unknown): value is ExtractionStatus {
  return value === "pending" || value === "processing" || value === "completed" || value === "failed";
}

// Membaca ID dan status dari response POST atau retry tanpa mengarang response ketika field wajib tidak ada.
export function readArticleReference(value: unknown): ArticleReference | null {
  const root = asRecord(value);
  const candidate = asRecord(root?.data) ?? root;
  if (!candidate) return null;

  const nestedArticle = asRecord(candidate.article);
  const source = nestedArticle ?? candidate;
  const articleId = typeof source.articleId === "string"
    ? source.articleId
    : typeof source.id === "string"
      ? source.id
      : null;

  if (!articleId) return null;
  return {
    articleId,
    extractionStatus: isExtractionStatus(source.extractionStatus) ? source.extractionStatus : undefined,
  };
}
