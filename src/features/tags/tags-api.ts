import { apiRequest } from "../../lib/api/client";
import type { Pagination, Tag } from "../../lib/api/types";

export type TagCollection = Tag[] | { data: Tag[]; pagination?: Pagination };

export type TagInput = {
  name: string;
};

export type ArticleTagAction = {
  articleId: string;
  tagId: string;
  action: "attach" | "detach";
};

// Mengambil seluruh tag milik user aktif dari endpoint Tags resmi.
export function getTags(signal?: AbortSignal) {
  return apiRequest<TagCollection>("/tags", { signal });
}

// Membuat tag baru menggunakan nama yang akan dinormalisasi dan divalidasi backend.
export function createTag(input: TagInput) {
  return apiRequest<unknown>("/tags", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// Mengganti nama tag tanpa mengubah artikel atau relasi yang sudah ada.
export function renameTag(tagId: string, input: TagInput) {
  return apiRequest<unknown>(`/tags/${encodeURIComponent(tagId)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

// Menghapus tag dan membiarkan artikel tetap tersimpan di library.
export function deleteTag(tagId: string) {
  return apiRequest<unknown>(`/tags/${encodeURIComponent(tagId)}`, { method: "DELETE" });
}

// Memasang tag ke artikel milik user aktif melalui relasi article-tag.
export function attachArticleTag(articleId: string, tagId: string) {
  return apiRequest<unknown>(`/articles/${encodeURIComponent(articleId)}/tags/${encodeURIComponent(tagId)}`, { method: "PUT" });
}

// Melepas tag dari artikel tanpa menghapus artikel atau tag itu sendiri.
export function detachArticleTag(articleId: string, tagId: string) {
  return apiRequest<unknown>(`/articles/${encodeURIComponent(articleId)}/tags/${encodeURIComponent(tagId)}`, { method: "DELETE" });
}

// Membuka envelope response tag tanpa menyediakan data pengganti ketika API mengembalikan collection kosong.
export function unwrapTags(response: TagCollection): Tag[] {
  return Array.isArray(response) ? response : response.data;
}
