import { useSyncExternalStore } from "react";
import type { ReadingStatus } from "./api/types";

export type LocalReadingProgress = {
  percent: number;
  status: ReadingStatus;
  updatedAt: string;
  finishedAt?: string;
};

export type LocalReadingProgressMap = Record<string, LocalReadingProgress>;

const STORAGE_KEY = "simpandulu-reading-progress";
const CHANGE_EVENT = "simpandulu:reading-progress";
const EMPTY_SNAPSHOT = "{}";

function readSnapshot() {
  if (typeof window === "undefined") return EMPTY_SNAPSHOT;
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_SNAPSHOT;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

function parseSnapshot(snapshot: string): LocalReadingProgressMap {
  try {
    const parsed = JSON.parse(snapshot) as LocalReadingProgressMap;
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => value && typeof value.percent === "number" && typeof value.status === "string"),
    ) as LocalReadingProgressMap;
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

export function useLocalReadingProgress() {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, () => EMPTY_SNAPSHOT);
  return parseSnapshot(snapshot);
}

export function normalizeProgress(value: number | null | undefined, status?: ReadingStatus) {
  if (status === "finished" && (value === null || value === undefined)) return 100;
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  const percent = value >= 0 && value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

export function getReadingStatus(percent: number): ReadingStatus {
  if (percent >= 95) return "finished";
  if (percent >= 5) return "reading";
  return "unread";
}

export function readingStatusLabel(status: ReadingStatus) {
  if (status === "finished") return "Selesai";
  if (status === "reading") return "Sedang dibaca";
  return "Belum dibaca";
}

export function saveLocalReadingProgress(articleId: string, percent: number) {
  if (typeof window === "undefined" || !articleId) return;
  const nextPercent = Math.max(0, Math.min(100, Math.round(percent)));
  const status = getReadingStatus(nextPercent);
  const current = parseSnapshot(readSnapshot());
  const previous = current[articleId];
  const next: LocalReadingProgress = {
    percent: Math.max(previous?.percent ?? 0, nextPercent),
    status: getReadingStatus(Math.max(previous?.percent ?? 0, nextPercent)),
    updatedAt: new Date().toISOString(),
    ...(status === "finished" || previous?.finishedAt ? { finishedAt: previous?.finishedAt ?? new Date().toISOString() } : {}),
  };
  current[articleId] = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // The reader remains usable when storage is unavailable.
  }
}
