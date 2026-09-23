import { useSyncExternalStore } from "react";

export type LocalTag = {
  id: string;
  name: string;
  articleIds: string[];
};

const STORAGE_KEY = "simpandulu-local-tags";
const CHANGE_EVENT = "simpandulu:local-tags";
const EMPTY_SNAPSHOT = "{}";

function readSnapshot() {
  if (typeof window === "undefined") return EMPTY_SNAPSHOT;
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_SNAPSHOT;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

function parseSnapshot(snapshot: string): Record<string, LocalTag> {
  try {
    const parsed = JSON.parse(snapshot) as Record<string, LocalTag>;
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => value && typeof value.id === "string" && typeof value.name === "string" && Array.isArray(value.articleIds)),
    ) as Record<string, LocalTag>;
  } catch {
    return {};
  }
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onStoreChange();
  };
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}

function slugify(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("id-ID")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function writeStore(store: Record<string, LocalTag>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Local-only tags are optional and should never break article reading.
  }
}

export function useLocalTags() {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, () => EMPTY_SNAPSHOT);
  return Object.values(parseSnapshot(snapshot)).sort((a, b) => a.name.localeCompare(b.name, "id"));
}

export function createLocalTag(name: string) {
  const cleanName = name.trim().replace(/\s+/g, " ").slice(0, 40);
  const id = `local-${slugify(cleanName)}`;
  if (!cleanName || id === "local-") return null;
  const store = parseSnapshot(readSnapshot());
  const existing = store[id];
  if (existing) return existing;
  const tag = { id, name: cleanName, articleIds: [] } satisfies LocalTag;
  store[id] = tag;
  writeStore(store);
  return tag;
}

export function toggleLocalTag(articleId: string, tagId: string) {
  const store = parseSnapshot(readSnapshot());
  const tag = store[tagId];
  if (!tag || !articleId) return;
  const assigned = new Set(tag.articleIds);
  if (assigned.has(articleId)) assigned.delete(articleId);
  else assigned.add(articleId);
  store[tagId] = { ...tag, articleIds: [...assigned] };
  writeStore(store);
}

export function getLocalTagsForArticle(tags: LocalTag[], articleId: string) {
  return tags.filter((tag) => tag.articleIds.includes(articleId));
}
