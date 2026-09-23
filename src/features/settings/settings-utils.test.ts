import { describe, expect, it } from "vitest";
import { ApiError } from "../../lib/api/client";
import { getSettingsErrorMessage, validatePasswordForm, validateProfileForm } from "./settings-utils";

describe("settings utils", () => {
  it("memvalidasi profil tanpa menerima field kosong", () => {
    expect(validateProfileForm({ name: " ", email: "not-an-email" })).toEqual({
      name: "Nama wajib diisi.",
      email: "Masukkan alamat email yang valid.",
    });
  });

  it("memvalidasi password dan konfirmasi password", () => {
    expect(validatePasswordForm({ currentPassword: "lama", newPassword: "baru", confirmPassword: "beda" })).toEqual({
      confirmPassword: "Konfirmasi password belum sama.",
    });
  });

  it("menggunakan pesan publik untuk konflik email", () => {
    expect(getSettingsErrorMessage(new ApiError("internal", 409), "profile")).toBe("Email tersebut sudah digunakan akun lain.");
  });
});
