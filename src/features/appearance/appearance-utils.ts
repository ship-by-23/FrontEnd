export type ReaderTheme = "light" | "dark";
export type ReaderFont = "serif" | "sans";
export type ReaderTextSize = "small" | "medium" | "large";
export type LibraryView = "grid" | "list";

export type AppearancePreferences = {
  theme: ReaderTheme;
  readerFont: ReaderFont;
  textSize: ReaderTextSize;
  libraryView: LibraryView;
};

export type AppearanceStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const APPEARANCE_STORAGE_KEY = "simpandulu-appearance";
export const READER_THEME_STORAGE_KEY = "reader-theme";

export const DEFAULT_APPEARANCE_PREFERENCES: AppearancePreferences = {
  theme: "light",
  readerFont: "serif",
  textSize: "medium",
  libraryView: "grid",
};

export const READER_FONT_CLASSES: Record<ReaderFont, string> = {
  serif: "font-serif",
  sans: "font-sans",
};

export const READER_TEXT_SIZE_CLASSES: Record<ReaderTextSize, string> = {
  small: "prose-base sm:prose-lg",
  medium: "prose-lg sm:prose-xl",
  large: "prose-xl sm:prose-2xl",
};

// Mengambil localStorage dengan aman ketika browser menolak akses storage atau kode berjalan di luar browser.
export function getAppearanceStorage(): AppearanceStorage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

// Memastikan nilai yang dibaca dari JSON benar-benar object sebelum field preference diakses.
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Mengembalikan value enum yang valid atau default tanpa mempercayai data storage mentah.
function readEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

// Membentuk preference lengkap dari data tersimpan, termasuk migrasi theme dari key Reader lama.
export function normalizeAppearancePreferences(value: unknown, legacyTheme?: unknown): AppearancePreferences {
  const source = isRecord(value) ? value : {};
  return {
    theme: readEnum(source.theme ?? legacyTheme, ["light", "dark"], DEFAULT_APPEARANCE_PREFERENCES.theme),
    readerFont: readEnum(source.readerFont, ["serif", "sans"], DEFAULT_APPEARANCE_PREFERENCES.readerFont),
    textSize: readEnum(source.textSize, ["small", "medium", "large"], DEFAULT_APPEARANCE_PREFERENCES.textSize),
    libraryView: readEnum(source.libraryView, ["grid", "list"], DEFAULT_APPEARANCE_PREFERENCES.libraryView),
  };
}

// Membaca preference lokal dan tetap menghasilkan default usable ketika key kosong atau JSON rusak.
export function readAppearancePreferences(storage: AppearanceStorage | null = getAppearanceStorage()): AppearancePreferences {
  if (!storage) return { ...DEFAULT_APPEARANCE_PREFERENCES };

  let storedValue: unknown;
  let legacyTheme: string | null = null;
  try {
    const rawValue = storage.getItem(APPEARANCE_STORAGE_KEY);
    storedValue = rawValue ? JSON.parse(rawValue) as unknown : undefined;
    legacyTheme = storage.getItem(READER_THEME_STORAGE_KEY);
  } catch {
    return { ...DEFAULT_APPEARANCE_PREFERENCES };
  }

  return normalizeAppearancePreferences(storedValue, legacyTheme);
}

// Menyimpan preference sebagai satu object atomik dan mengembalikan status persistensi browser.
export function persistAppearancePreferences(
  preferences: AppearancePreferences,
  storage: AppearanceStorage | null = getAppearanceStorage(),
) {
  if (!storage) return false;

  try {
    storage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}

// Mengecek kemampuan write browser tanpa membocorkan error storage ke UI sebagai exception.
export function isAppearanceStorageAvailable(storage: AppearanceStorage | null = getAppearanceStorage()) {
  if (!storage) return false;

  try {
    const probeKey = `${APPEARANCE_STORAGE_KEY}:probe`;
    storage.setItem(probeKey, "1");
    storage.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
}

// Menyediakan kompatibilitas untuk Reader lama yang hanya menyimpan pilihan theme.
export function getInitialReaderTheme(): ReaderTheme {
  return readAppearancePreferences().theme;
}

// Menyimpan perubahan theme lama ke format preference baru tanpa membuat endpoint backend.
export function persistReaderTheme(theme: ReaderTheme) {
  const current = readAppearancePreferences();
  return persistAppearancePreferences({ ...current, theme });
}
