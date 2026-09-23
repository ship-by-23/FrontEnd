import { apiRequest } from "../../lib/api/client";
import { parseUserResponse } from "../../lib/api/contracts";
import type { User } from "../../lib/api/types";

export type AuthUserResponse = User | { data: User };

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type ProfileUpdateInput = {
  name: string;
  email: string;
};

export type PasswordUpdateInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

// Membuat akun melalui endpoint auth nyata tanpa menyimpan credential di client.
export function registerUser(input: RegisterInput) {
  return apiRequest<unknown>("/auth/register", {
    method: "POST",
    retryUnauthorized: false,
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      password: input.password,
      passwordConfirmation: input.confirmPassword,
    }),
  });
}

// Membuat session melalui endpoint auth nyata tanpa mengasumsikan bentuk response UI.
export function loginUser(input: LoginInput) {
  return apiRequest<unknown>("/auth/login", {
    method: "POST",
    retryUnauthorized: false,
    body: JSON.stringify(input),
  });
}

// Mengambil user aktif; api client menangani satu kali refresh jika session access expired.
export function getCurrentUser() {
  return apiRequest<unknown>("/me").then(parseUserResponse);
}

// Memperbarui field profil yang didukung backend tanpa menyimpan response mentah sebagai state lokal.
export function updateCurrentUser(input: ProfileUpdateInput) {
  return apiRequest<unknown>("/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

// Mengubah password melalui endpoint resmi tanpa menyimpan credential setelah request selesai.
export function updateCurrentPassword(input: PasswordUpdateInput) {
  return apiRequest<unknown>("/me/password", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

// Mencabut session aktif tanpa mencoba refresh ketika server mengembalikan 401.
export function logoutUser() {
  return apiRequest<void>("/auth/logout", { method: "POST", retryUnauthorized: false });
}
