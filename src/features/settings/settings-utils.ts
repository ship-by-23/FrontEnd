import { ApiError } from "../../lib/api/client";

export type ProfileFormFields = {
  name: string;
  email: string;
};

export type PasswordFormFields = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ProfileField = keyof ProfileFormFields;
export type PasswordField = keyof PasswordFormFields;
export type SettingsFormErrors<Field extends string> = Partial<Record<Field, string>>;

// Memastikan field profil memenuhi validasi frontend tanpa mengarang password policy backend.
export function validateProfileForm(fields: ProfileFormFields): SettingsFormErrors<ProfileField> {
  const errors: SettingsFormErrors<ProfileField> = {};
  const name = fields.name.trim();
  const email = fields.email.trim();

  if (!name) errors.name = "Nama wajib diisi.";
  if (!email) errors.email = "Email wajib diisi.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Masukkan alamat email yang valid.";

  return errors;
}

// Memastikan form password lengkap dan konfirmasi sama sebelum credential dikirim ke backend.
export function validatePasswordForm(fields: PasswordFormFields): SettingsFormErrors<PasswordField> {
  const errors: SettingsFormErrors<PasswordField> = {};

  if (!fields.currentPassword) errors.currentPassword = "Password saat ini wajib diisi.";
  if (!fields.newPassword) errors.newPassword = "Password baru wajib diisi.";
  if (!fields.confirmPassword) errors.confirmPassword = "Konfirmasi password wajib diisi.";
  else if (fields.newPassword !== fields.confirmPassword) errors.confirmPassword = "Konfirmasi password belum sama.";

  return errors;
}

// Mengubah status API menjadi pesan publik yang aman untuk halaman pengaturan.
export function getSettingsErrorMessage(error: unknown, action: "profile" | "password") {
  if (!(error instanceof ApiError)) return "Layanan belum dapat dihubungi. Periksa koneksi lalu coba lagi.";
  if (error.status === 401) return "Sesi berakhir. Masuk kembali untuk mengubah pengaturan.";
  if (error.status === 403) return "Kamu tidak memiliki izin untuk mengubah pengaturan ini.";
  if (error.status === 409 && action === "profile") return "Email tersebut sudah digunakan akun lain.";
  if (error.status === 422) return action === "password" ? "Password saat ini atau password baru tidak dapat digunakan." : "Periksa kembali data profil.";
  if (error.status === 429) return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
  if (error.status >= 500) return "Layanan sedang mengalami kendala. Coba lagi beberapa saat.";
  return action === "password" ? "Password belum dapat diubah. Coba lagi." : "Profil belum dapat diperbarui. Coba lagi.";
}
