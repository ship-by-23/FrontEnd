import { getAppConfig } from "../config";
import type { ApiErrorPayload, AuthSessionResponse } from "./types";

export const SESSION_EXPIRED_EVENT = "simpandulu:session-expired";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code = "UNKNOWN_ERROR",
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let refreshRequest: Promise<boolean> | null = null;
let accessToken: string | null = null;

// Menyimpan access token hanya di memory browser; refresh token tetap dikelola oleh cookie HTTP-only backend.
export function setAccessToken(token: string | null) {
  accessToken = token;
}

// Memberi tahu AuthProvider bahwa refresh gagal sehingga route privat dapat kembali ke login.
function announceSessionExpired() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

// Membaca body JSON jika tersedia tanpa menutupi status HTTP asli.
async function readJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json") || response.status === 204) return undefined;
  return response.json().catch(() => undefined);
}

// Mengubah response gagal menjadi error publik yang aman ditampilkan.
async function toApiError(response: Response) {
  const payload = (await readJson(response)) as ApiErrorPayload | undefined;
  return new ApiError(
    payload?.error?.message ?? "Permintaan tidak dapat diproses. Silakan coba lagi.",
    response.status,
    payload?.error?.code,
    payload?.error?.fields,
  );
}

// Merotasi sesi sekali untuk semua request yang bersamaan.
async function refreshSession() {
  if (!refreshRequest) {
    const { apiUrl } = getAppConfig();
    refreshRequest = fetch(`${apiUrl}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) return false;
        const payload = (await readJson(response)) as AuthSessionResponse | undefined;
        const nextToken = payload?.data?.accessToken;
        if (!nextToken) return false;
        setAccessToken(nextToken);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
}

type RequestOptions = RequestInit & { retryUnauthorized?: boolean };

// Mengirim request API dengan cookie sesi, JSON, abort signal, dan satu kali refresh.
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { apiUrl } = getAppConfig();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (accessToken && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${accessToken}`);
  if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const mayRefresh = options.retryUnauthorized !== false && !path.startsWith("/auth/");
  if (response.status === 401 && mayRefresh) {
    if (await refreshSession()) return apiRequest<T>(path, { ...options, retryUnauthorized: false });
    announceSessionExpired();
  }
  if (!response.ok) throw await toApiError(response);
  return (await readJson(response)) as T;
}
