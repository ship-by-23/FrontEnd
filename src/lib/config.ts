export type AppConfig = {
  apiUrl: string;
};

// Memvalidasi konfigurasi publik sebelum dipakai oleh lapisan jaringan.
export function getAppConfig(): AppConfig {
  const apiUrl = import.meta.env.VITE_API_URL?.trim();
  if (!apiUrl) {
    throw new Error("VITE_API_URL belum dikonfigurasi. Salin .env.example menjadi .env.");
  }
  return { apiUrl: apiUrl.replace(/\/$/, "") };
}
