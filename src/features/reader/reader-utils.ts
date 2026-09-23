import { ApiError } from "../../lib/api/client";

export {
  getInitialReaderTheme,
  persistReaderTheme,
  READER_THEME_STORAGE_KEY,
  type ReaderTheme,
} from "../appearance/appearance-utils";
export const READER_PROGRESS_THROTTLE_MS = 1_500;

// Membatasi progress ke rentang yang dapat dipahami progress bar dan backend.
export function clampReadingProgress(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

// Menghitung progress berdasarkan rentang scroll artikel tanpa mengirim request dari event scroll.
export function calculateReadingProgress(container: HTMLElement, scrollY: number, viewportHeight: number) {
  const rect = container.getBoundingClientRect();
  const start = rect.top + scrollY;
  const end = start + rect.height - viewportHeight;

  if (!Number.isFinite(start) || !Number.isFinite(end) || rect.height <= 0) return 0;
  if (end <= start) return scrollY >= start ? 100 : 0;

  return clampReadingProgress(((scrollY - start) / (end - start)) * 100);
}

// Mengubah progress tersimpan menjadi posisi scroll untuk fallback ketika anchor tidak tersedia.
export function getScrollPositionForProgress(
  container: HTMLElement,
  progress: number,
  viewportHeight: number,
  scrollY: number,
) {
  const rect = container.getBoundingClientRect();
  const start = rect.top + scrollY;
  const end = start + rect.height - viewportHeight;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return start;

  return start + ((end - start) * clampReadingProgress(progress)) / 100;
}

// Mencari anchor yang dikirim backend pada id atau data attribute yang tersedia di HTML artikel.
export function findReaderAnchor(container: HTMLElement, anchor: string | null | undefined) {
  const normalizedAnchor = anchor?.replace(/^#/, "").trim();
  if (!normalizedAnchor) return null;

  const candidates = container.querySelectorAll<HTMLElement>("[id], [data-reader-anchor]");
  for (const candidate of candidates) {
    if (candidate.id === normalizedAnchor || candidate.dataset.readerAnchor === normalizedAnchor) return candidate;
  }

  return null;
}

// Mengambil anchor terdekat dari viewport hanya jika HTML backend memang menyediakan anchor stabil.
export function findVisibleReaderAnchor(container: HTMLElement, viewportHeight: number) {
  const candidates = container.querySelectorAll<HTMLElement>("[id], [data-reader-anchor]");
  let closestAnchor: string | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const rect = candidate.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= viewportHeight) continue;
    const distance = Math.abs(rect.top);
    if (distance >= closestDistance) continue;

    const anchor = candidate.dataset.readerAnchor ?? candidate.id;
    if (!anchor) continue;
    closestAnchor = anchor;
    closestDistance = distance;
  }

  return closestAnchor;
}

// Memastikan tautan sumber hanya membuka URL HTTP atau HTTPS yang valid.
export function getSafeReaderSourceUrl(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

// Memetakan error Reader menjadi pesan publik tanpa membocorkan detail internal backend.
export function getReaderErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return "Artikel tidak dapat dibuka. Periksa koneksi lalu coba lagi.";
  if (error.status === 401) return "Sesi berakhir. Masuk kembali untuk membaca artikel.";
  if (error.status === 403) return "Kamu tidak memiliki izin untuk membaca artikel ini.";
  if (error.status === 404) return "Artikel tidak ditemukan atau sudah tidak tersedia.";
  if (error.status === 408 || error.status === 429 || error.status >= 500) return "Artikel belum dapat dibuka. Coba lagi sebentar.";
  return "Artikel tidak dapat dibuka. Coba lagi.";
}
