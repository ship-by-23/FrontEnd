import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE_PREFERENCES,
  getAppearanceStorage,
  isAppearanceStorageAvailable,
  normalizeAppearancePreferences,
  persistAppearancePreferences,
  readAppearancePreferences,
  READER_THEME_STORAGE_KEY,
  type AppearancePreferences,
} from "./appearance-utils";

type AppearanceContextValue = {
  preferences: AppearancePreferences;
  storageAvailable: boolean;
  updatePreferences: (patch: Partial<AppearancePreferences>) => boolean;
  resetPreferences: () => boolean;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

// Menjaga preference tampilan yang sama ketika user berpindah antara Settings, Reader, dan Library.
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AppearancePreferences>(() => readAppearancePreferences());
  const [storageAvailable, setStorageAvailable] = useState(() => isAppearanceStorageAvailable());
  const preferencesRef = useRef(preferences);

  // Menormalisasi, menerapkan, lalu menyimpan perubahan preference tanpa request API palsu.
  const updatePreferences = useCallback((patch: Partial<AppearancePreferences>) => {
    const nextPreferences = normalizeAppearancePreferences({ ...preferencesRef.current, ...patch });
    preferencesRef.current = nextPreferences;
    setPreferences(nextPreferences);
    const persisted = persistAppearancePreferences(nextPreferences);
    setStorageAvailable(persisted);
    return persisted;
  }, []);

  // Mengembalikan seluruh preference ke default produk ketika user ingin menghapus penyesuaian lokal.
  const resetPreferences = useCallback(() => {
    const nextPreferences = { ...DEFAULT_APPEARANCE_PREFERENCES };
    preferencesRef.current = nextPreferences;
    setPreferences(nextPreferences);
    const persisted = persistAppearancePreferences(nextPreferences);
    setStorageAvailable(persisted);
    return persisted;
  }, []);

  useEffect(() => {
    // Menyelaraskan tab lain tanpa menjadikan preference sebagai server state.
    function handleStorageChange(event: StorageEvent) {
      if (event.key !== APPEARANCE_STORAGE_KEY && event.key !== READER_THEME_STORAGE_KEY) return;
      const nextPreferences = readAppearancePreferences(event.storageArea ?? getAppearanceStorage());
      preferencesRef.current = nextPreferences;
      setPreferences(nextPreferences);
    }

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const value = useMemo<AppearanceContextValue>(() => ({
    preferences,
    storageAvailable,
    updatePreferences,
    resetPreferences,
  }), [preferences, resetPreferences, storageAvailable, updatePreferences]);

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

// Mengambil preference tampilan aktif dan memastikan hook hanya digunakan di bawah provider.
export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error("useAppearance harus digunakan di dalam AppearanceProvider.");
  return context;
}
