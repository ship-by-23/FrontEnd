import { describe, expect, it } from "vitest";
import { ApiError } from "../../lib/api/client";
import { getTagMutationErrorMessage, parseTagPage, validateTagName } from "./tags-utils";

describe("tag utilities", () => {
  it("menolak nama tag kosong tetapi tidak meniru aturan normalisasi backend", () => {
    expect(validateTagName("   ")).toBe("Nama tag wajib diisi.");
    expect(validateTagName("  Frontend  ")).toBeNull();
  });

  it("menampilkan pesan duplicate yang aman dari response backend", () => {
    expect(getTagMutationErrorMessage(new ApiError("internal", 409, "TAG_NAME_EXISTS"), "create")).toBe("Nama tag tersebut sudah digunakan. Gunakan nama lain.");
  });

  it("menggunakan pesan field backend untuk validation error nama", () => {
    expect(getTagMutationErrorMessage(new ApiError("internal", 422, "VALIDATION_ERROR", { name: "Nama tag terlalu panjang." }), "rename")).toBe("Nama tag terlalu panjang.");
  });

  it("mengembalikan halaman satu untuk parameter URL yang tidak valid", () => {
    expect(parseTagPage(null)).toBe(1);
    expect(parseTagPage("0")).toBe(1);
    expect(parseTagPage("abc")).toBe(1);
    expect(parseTagPage("3")).toBe(3);
  });
});
