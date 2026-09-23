import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { queryClient } from "../../app/query-client";
import { ApiError, SESSION_EXPIRED_EVENT } from "../../lib/api/client";
import type { User } from "../../lib/api/types";
import { AuthContext, type AuthContextValue, type AuthState, type SessionResult } from "./auth-context";
import { getCurrentUser, logoutUser } from "./auth-api";

type UserResponse = User | { data: User };

// Menormalisasi respons profil agar boundary tetap kompatibel dengan dua envelope umum.
function unwrapUser(response: UserResponse) {
  return "data" in response ? response.data : response;
}

// Menyediakan state session terpusat tanpa menyimpan token di localStorage.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null, error: null });
  const sessionRequestId = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++sessionRequestId.current;
    setState({ status: "loading", user: null, error: null });
    try {
      const response: UserResponse = await getCurrentUser();
      if (requestId !== sessionRequestId.current) return "unauthenticated" satisfies SessionResult;
      setState({ status: "authenticated", user: unwrapUser(response), error: null });
      return "authenticated" satisfies SessionResult;
    } catch (error) {
      if (requestId !== sessionRequestId.current) return "unauthenticated" satisfies SessionResult;
      if (error instanceof ApiError && error.status === 401) {
        setState({ status: "unauthenticated", user: null, error: null });
        return "unauthenticated" satisfies SessionResult;
      }
      setState({
        status: "error",
        user: null,
        error: error instanceof Error ? error : new Error("Sesi tidak dapat diperiksa."),
      });
      return "error" satisfies SessionResult;
    }
  }, []);

  const logout = useCallback(async () => {
    sessionRequestId.current += 1;
    let serverLogoutSucceeded = true;
    try {
      await logoutUser();
    } catch {
      serverLogoutSucceeded = false;
    } finally {
      queryClient.clear();
      setState({ status: "unauthenticated", user: null, error: null });
    }
    return serverLogoutSucceeded;
  }, []);

  useEffect(() => {
    // Mengubah route privat menjadi unauthenticated ketika API client gagal me-refresh session.
    function handleSessionExpired() {
      sessionRequestId.current += 1;
      queryClient.clear();
      setState({ status: "unauthenticated", user: null, error: null });
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    const task = window.setTimeout(() => void refresh(), 0);
    return () => {
      window.clearTimeout(task);
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [refresh]);

  const value = useMemo<AuthContextValue>(() => ({ ...state, refresh, logout }), [state, refresh, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
