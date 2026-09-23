export type AppConfig = {
  apiUrl: string;
};

// Memvalidasi konfigurasi publik sebelum dipakai oleh lapisan jaringan.
export function getAppConfig(): AppConfig {
  const apiUrl = import.meta.env.VITE_API_URL?.trim();
  if (!apiUrl) {
    throw new Error("VITE_API_URL belum dikonfigurasi. Salin .env.example menjadi .env.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(apiUrl);
  } catch {
    throw new Error("VITE_API_URL harus berupa URL absolut yang valid.");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("VITE_API_URL harus menggunakan HTTP atau HTTPS.");
  }

  if (import.meta.env.PROD && parsedUrl.protocol !== "https:") {
    throw new Error("Production frontend hanya boleh menggunakan API HTTPS.");
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  if (import.meta.env.PROD && (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]")) {
    throw new Error("Production frontend tidak boleh menggunakan API localhost.");
  }

  return { apiUrl: apiUrl.replace(/\/$/, "") };
}
