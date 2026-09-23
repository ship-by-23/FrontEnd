import { createContext, useContext } from "react";
import type { User } from "../../lib/api/types";

export type AuthState =
  | { status: "loading"; user: null; error: null }
  | { status: "authenticated"; user: User; error: null }
  | { status: "unauthenticated"; user: null; error: null }
  | { status: "error"; user: null; error: Error };

export type SessionResult = Exclude<AuthState["status"], "loading">;

export type AuthContextValue = AuthState & {
  refresh: () => Promise<SessionResult>;
  logout: () => Promise<boolean>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

// Memberikan akses aman ke state session dari seluruh route.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth harus digunakan di dalam AuthProvider.");
  return context;
}
