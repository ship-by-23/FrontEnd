export type AppConfig = {
  apiUrl: string;
  appEnv?: string;
  appVersion?: string;
};

const API_PREFIX = "/api/v1";

// Mengambil konfigurasi yang disuntikkan container tanpa mempercayai nilai non-string.
function getRuntimeConfig() {
  if (typeof window === "undefined") return undefined;
  return window.__SIMPANDULU_CONFIG__;
}

// Memvalidasi URL API dan memastikan prefix contract tidak hilang ketika environment berubah.
function validateApiUrl(value: string) {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error("URL API harus berupa URL absolut yang valid.");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("URL API harus menggunakan HTTP atau HTTPS.");
  }
  if (parsedUrl.username || parsedUrl.password || parsedUrl.search || parsedUrl.hash) {
    throw new Error("URL API tidak boleh berisi credential, query, atau hash.");
  }
  if (parsedUrl.pathname.replace(/\/+$/, "") !== API_PREFIX) {
    throw new Error(`URL API harus berakhir dengan ${API_PREFIX}.`);
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  if (import.meta.env.PROD && ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"].includes(hostname)) {
    throw new Error("Production frontend tidak boleh menggunakan API localhost atau loopback.");
  }

  return parsedUrl.toString().replace(/\/$/, "");
}

// Memvalidasi konfigurasi publik sebelum dipakai oleh lapisan jaringan.
export function getAppConfig(): AppConfig {
  const runtimeConfig = getRuntimeConfig();
  const runtimeApiUrl = runtimeConfig?.apiUrl?.trim();
  const buildApiUrl = import.meta.env.VITE_API_URL?.trim();

  if (import.meta.env.PROD && !runtimeApiUrl) {
    throw new Error("Runtime API URL belum dikonfigurasi. Set API_URL pada container sebelum menjalankan frontend.");
  }

  const apiUrl = runtimeApiUrl ?? buildApiUrl;
  if (!apiUrl) {
    throw new Error("URL API belum dikonfigurasi. Untuk development, isi VITE_API_URL pada .env.");
  }

  const validatedApiUrl = validateApiUrl(apiUrl);
  if (import.meta.env.PROD && !validatedApiUrl.startsWith("https://")) {
    throw new Error("Production frontend hanya boleh menggunakan API HTTPS.");
  }

  return {
    apiUrl: validatedApiUrl,
    appEnv: runtimeConfig?.appEnv?.trim() || import.meta.env.VITE_APP_ENV?.trim(),
    appVersion: runtimeConfig?.appVersion?.trim() || import.meta.env.VITE_APP_VERSION?.trim(),
  };
}
