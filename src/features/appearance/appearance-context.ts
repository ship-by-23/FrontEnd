import { createContext, useContext } from "react";
import type { AppearancePreferences } from "./appearance-utils";

export type AppearanceContextValue = {
  preferences: AppearancePreferences;
  storageAvailable: boolean;
  updatePreferences: (patch: Partial<AppearancePreferences>) => boolean;
  resetPreferences: () => boolean;
};

export const AppearanceContext = createContext<AppearanceContextValue | null>(null);

// Mengambil preference tampilan aktif dan memastikan hook hanya digunakan di bawah provider.
export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error("useAppearance harus digunakan di dalam AppearanceProvider.");
  return context;
}
