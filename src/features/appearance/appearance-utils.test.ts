import { describe, expect, it } from "vitest";
import {
  DEFAULT_APPEARANCE_PREFERENCES,
  normalizeAppearancePreferences,
  persistAppearancePreferences,
  readAppearancePreferences,
  type AppearanceStorage,
} from "./appearance-utils";

// Menyediakan storage in-memory agar perilaku preference dapat diuji tanpa browser atau localStorage nyata.
function createMemoryStorage(initial: Record<string, string> = {}): AppearanceStorage {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

describe("appearance preference utilities", () => {
  it("menggunakan default ketika storage tidak tersedia", () => {
    expect(readAppearancePreferences(null)).toEqual(DEFAULT_APPEARANCE_PREFERENCES);
  });

  it("membaca preference valid dan mempertahankan field yang didukung", () => {
    const storage = createMemoryStorage({
      "simpandulu-appearance": JSON.stringify({ theme: "dark", readerFont: "sans", textSize: "large", libraryView: "list" }),
    });

    expect(readAppearancePreferences(storage)).toEqual({
      theme: "dark",
      readerFont: "sans",
      textSize: "large",
      libraryView: "list",
    });
  });

  it("memakai theme dari key lama saat preference baru belum ada", () => {
    const storage = createMemoryStorage({ "reader-theme": "dark" });

    expect(readAppearancePreferences(storage).theme).toBe("dark");
  });

  it("mengabaikan value invalid dan kembali ke default per field", () => {
    expect(normalizeAppearancePreferences({ theme: "system", readerFont: "mono", textSize: "huge", libraryView: "cards" })).toEqual(DEFAULT_APPEARANCE_PREFERENCES);
  });

  it("menyimpan object preference secara atomik", () => {
    const storage = createMemoryStorage();
    const preferences = { theme: "dark" as const, readerFont: "sans" as const, textSize: "small" as const, libraryView: "list" as const };

    expect(persistAppearancePreferences(preferences, storage)).toBe(true);
    expect(readAppearancePreferences(storage)).toEqual(preferences);
  });

  it("tidak melempar exception ketika storage gagal menulis", () => {
    const storage: AppearanceStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("storage blocked");
      },
      removeItem: () => undefined,
    };

    expect(persistAppearancePreferences(DEFAULT_APPEARANCE_PREFERENCES, storage)).toBe(false);
  });
});
