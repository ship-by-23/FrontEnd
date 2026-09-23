import { describe, expect, it } from "vitest";
import { ApiError } from "../../lib/api/client";
import { getAuthErrorMessage, getSafeDestination, validateAuthForm, type AuthFormFields } from "./auth-utils";

const validRegisterFields: AuthFormFields = {
  name: "Ari",
  email: "ari@example.com",
  password: "password",
  confirmPassword: "password",
};

describe("auth utilities", () => {
  it("memvalidasi field register tanpa mengarang minimum panjang password", () => {
    expect(validateAuthForm(validRegisterFields, "register")).toEqual({});
  });

  it("menolak email tidak valid dan konfirmasi password yang berbeda", () => {
    expect(validateAuthForm({ ...validRegisterFields, email: "ari", confirmPassword: "beda" }, "register")).toEqual({
      email: "Masukkan alamat email yang valid.",
      confirmPassword: "Konfirmasi password belum sama.",
    });
  });

  it("menolak tujuan redirect eksternal atau protocol-relative", () => {
    expect(getSafeDestination({ from: "//evil.example" })).toBe("/library");
    expect(getSafeDestination({ from: "https://evil.example" })).toBe("/library");
    expect(getSafeDestination({ from: "/articles/123?highlight=1" })).toBe("/articles/123?highlight=1");
  });

  it("menggunakan pesan login generik untuk error credential", () => {
    expect(getAuthErrorMessage(new ApiError("detail internal", 401), "login")).toBe("Email atau password tidak dapat digunakan.");
  });
});
