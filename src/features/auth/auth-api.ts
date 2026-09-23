import { apiRequest } from "../../lib/api/client";
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

// Membuat akun melalui endpoint auth nyata tanpa menyimpan credential di client.
export function registerUser(input: RegisterInput) {
  return apiRequest<unknown>("/auth/register", {
    method: "POST",
    retryUnauthorized: false,
    body: JSON.stringify(input),
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
  return apiRequest<AuthUserResponse>("/me");
}

// Mencabut session aktif tanpa mencoba refresh ketika server mengembalikan 401.
export function logoutUser() {
  return apiRequest<void>("/auth/logout", { method: "POST", retryUnauthorized: false });
}
