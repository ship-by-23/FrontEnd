import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { queryClient } from "../../app/query-client";
import { ApiError, apiRequest } from "../../lib/api/client";
import type { User } from "../../lib/api/types";
import { AuthContext, type AuthContextValue, type AuthState } from "./auth-context";

type UserResponse = User | { data: User };

// Menormalisasi respons profil agar boundary tetap kompatibel dengan dua envelope umum.
function unwrapUser(response: UserResponse) {
  return "data" in response ? response.data : response;
}

// Menyediakan state session terpusat tanpa menyimpan token di localStorage.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null, error: null });

  const refresh = useCallback(async () => {
    setState({ status: "loading", user: null, error: null });
    try {
      const response = await apiRequest<UserResponse>("/me");
      setState({ status: "authenticated", user: unwrapUser(response), error: null });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setState({ status: "unauthenticated", user: null, error: null });
        return;
      }
      setState({
        status: "error",
        user: null,
        error: error instanceof Error ? error : new Error("Sesi tidak dapat diperiksa."),
      });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest<void>("/auth/logout", { method: "POST", retryUnauthorized: false });
    } finally {
      queryClient.clear();
      setState({ status: "unauthenticated", user: null, error: null });
    }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(task);
  }, [refresh]);

  const value = useMemo<AuthContextValue>(() => ({ ...state, refresh, logout }), [state, refresh, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
