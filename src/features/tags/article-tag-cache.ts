import type { ArticleSummary, Tag } from "../../lib/api/types";

type ArticleTagOverride = {
  attached: Tag[];
  detachedIds: string[];
};

type ArticleTagOverrideStore = Record<string, ArticleTagOverride>;

const STORAGE_KEY = "simpandulu-article-tag-overrides";

function isTag(value: unknown): value is Tag {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.name === "string";
}

function readStore(): ArticleTagOverrideStore {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};

    return Object.fromEntries(
      Object.entries(parsed).flatMap(([articleId, value]) => {
        if (!value || typeof value !== "object") return [];
        const record = value as Record<string, unknown>;
        const attached = Array.isArray(record.attached) ? record.attached.filter(isTag) : [];
        const detachedIds = Array.isArray(record.detachedIds)
          ? record.detachedIds.filter((id): id is string => typeof id === "string")
          : [];
        if (attached.length === 0 && detachedIds.length === 0) return [];
        return [[articleId, { attached, detachedIds }]];
      }),
    ) as ArticleTagOverrideStore;
  } catch {
    return {};
  }
}

function writeStore(store: ArticleTagOverrideStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Cache ini hanya membantu tampilan; kegagalan storage tidak boleh menggagalkan API mutation.
  }
}

// Menyimpan perubahan relasi terakhir ketika endpoint collection belum mengembalikan daftar tag artikel.
export function rememberArticleTagChange(articleId: string, tag: Tag, action: "attach" | "detach") {
  if (!articleId) return;

  const store = readStore();
  const current = store[articleId] ?? { attached: [], detachedIds: [] };
  const attached = current.attached.filter((item) => item.id !== tag.id);
  const detachedIds = current.detachedIds.filter((id) => id !== tag.id);

  if (action === "attach") attached.push(tag);
  else detachedIds.push(tag.id);

  store[articleId] = { attached, detachedIds };
  writeStore(store);
}

// Menghapus override tag ketika tag akun dihapus dari sistem.
export function forgetArticleTagOverride(tagId: string) {
  if (!tagId) return;

  const store = readStore();
  let changed = false;
  for (const [articleId, override] of Object.entries(store)) {
    const attached = override.attached.filter((tag) => tag.id !== tagId);
    const detachedIds = override.detachedIds.filter((id) => id !== tagId);
    if (attached.length === override.attached.length && detachedIds.length === override.detachedIds.length) continue;
    changed = true;
    if (attached.length === 0 && detachedIds.length === 0) delete store[articleId];
    else store[articleId] = { attached, detachedIds };
  }

  if (changed) writeStore(store);
}

// Menggabungkan tag dari API dengan perubahan frontend terakhir tanpa mengarang data tag baru.
export function mergeCachedArticleTags(article: ArticleSummary, availableTags: Tag[] = []) {
  const override = readStore()[article.id];
  if (!override && !article.tags) return article;

  const availableById = new Map(availableTags.map((tag) => [tag.id, tag]));
  const detachedIds = new Set(override?.detachedIds ?? []);
  const merged = new Map<string, Tag>();

  for (const tag of article.tags ?? []) {
    if (!detachedIds.has(tag.id)) merged.set(tag.id, availableById.get(tag.id) ?? tag);
  }
  for (const tag of override?.attached ?? []) {
    if (!detachedIds.has(tag.id)) merged.set(tag.id, availableById.get(tag.id) ?? tag);
  }

  return { ...article, tags: [...merged.values()] };
}
