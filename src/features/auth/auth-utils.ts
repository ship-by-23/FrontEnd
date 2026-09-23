import { ApiError } from "../../lib/api/client";

export type AuthMode = "login" | "register";

export type AuthFormFields = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type AuthField = keyof AuthFormFields;
export type AuthFormErrors = Partial<Record<AuthField, string>>;

// Memastikan tujuan redirect hanya mengarah ke path internal aplikasi.
export function getSafeDestination(state: unknown): string {
  if (typeof state !== "object" || state === null || !("from" in state) || typeof state.from !== "string") {
    return "/library";
  }

  const destination = state.from;
  if (!destination.startsWith("/") || destination.startsWith("//") || destination.includes("\\")) {
    return "/library";
  }

  try {
    const origin = typeof window === "undefined" ? "https://simpandulu.invalid" : window.location.origin;
    const url = new URL(destination, origin);
    if (url.origin !== origin) return "/library";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/library";
  }
}

// Mengambil pesan sukses setelah pendaftaran tanpa mempercayai bentuk state route secara langsung.
export function getAuthNotice(state: unknown): string | null {
  if (typeof state !== "object" || state === null || !("notice" in state) || typeof state.notice !== "string") {
    return null;
  }
  return state.notice;
}

// Memvalidasi field auth yang dapat dipastikan frontend tanpa mengarang password policy backend.
export function validateAuthForm(fields: AuthFormFields, mode: AuthMode): AuthFormErrors {
  const errors: AuthFormErrors = {};
  const email = fields.email.trim();

  if (mode === "register" && !fields.name.trim()) errors.name = "Nama wajib diisi.";
  if (!email) errors.email = "Email wajib diisi.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Masukkan alamat email yang valid.";
  if (!fields.password) errors.password = "Password wajib diisi.";

  if (mode === "register") {
    if (!fields.confirmPassword) errors.confirmPassword = "Konfirmasi password wajib diisi.";
    else if (fields.password !== fields.confirmPassword) errors.confirmPassword = "Konfirmasi password belum sama.";
  }

  return errors;
}

// Menyembunyikan detail error server yang tidak aman dan menjaga error login tetap generik.
export function getAuthErrorMessage(error: unknown, mode: AuthMode): string {
  if (!(error instanceof ApiError)) return "Server belum dapat dihubungi. Coba lagi.";
  if (error.status === 401 || error.status === 403) return "Email atau password tidak dapat digunakan.";
  if (error.status === 422) return mode === "register" ? "Periksa kembali data pendaftaran." : "Periksa kembali data yang dimasukkan.";
  if (error.status === 429) return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
  return "Permintaan autentikasi tidak dapat diproses. Coba lagi.";
}
