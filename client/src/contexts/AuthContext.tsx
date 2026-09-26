import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth as useClerkAuth, useClerk } from "@clerk/react";
import { api, ApiError } from "@/lib/api";
import type { UserRole } from "@shared/schema";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Identity providers
 * ------------------
 * Clerk mode (default): `VITE_CLERK_PUBLISHABLE_KEY` is set and
 * `<ClerkProvider>` wraps this provider (see App.tsx). Session state comes
 * from Clerk; the local profile (role, id) is synced from `/api/auth/me`,
 * which auto-provisions/links the Clerk user into the `users` table.
 *
 * Legacy mode (fallback): no publishable key configured — behaves exactly like
 * the pre-Clerk build (cookie JWT from the server). Kept so local builds and
 * environments without Clerk keys still boot instead of crashing at runtime.
 */
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
  | string
  | undefined;

/** Original cookie/JWT implementation, kept as the no-Clerk fallback. */
function useLegacyAuthValue(): AuthContextValue {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<AuthUser>("/api/auth/me")
      .then(data => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<AuthUser>("/api/auth/login", {
      email,
      password,
    });
    setUser(data);
  }, []);

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout").catch((err: unknown) => {
      if (!(err instanceof ApiError)) throw err;
    });
    setUser(null);
  }, []);

  return { user, isLoading, login, logout };
}

/** Clerk-backed implementation with the same external contract. */
function useClerkAuthValue(): AuthContextValue {
  const clerk = useClerk();
  const { isLoaded, isSignedIn, userId } = useClerkAuth();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !userId) {
      setUser(null);
      setSynced(true);
      return;
    }

    let cancelled = false;
    // The Clerk session is authoritative for "who"; the server is
    // authoritative for the local profile (role, suspended status, etc.).
    // /me also provisions/links the Clerk account into the users table.
    api
      .get<AuthUser>("/api/auth/me")
      .then(data => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setSynced(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId]);

  // Kept for call-site compatibility; credentials are handled by <SignIn />.
  const login = useCallback(async () => {
    clerk.openSignIn();
    await new Promise<void>(() => {});
  }, [clerk]);

  const logout = useCallback(async () => {
    await clerk.signOut().catch(() => undefined);
    setUser(null);
    setSynced(false);
  }, [clerk]);

  return {
    user,
    isLoading: !isLoaded || (Boolean(isSignedIn) && !synced),
    login,
    logout,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value = CLERK_PUBLISHABLE_KEY
    ? useClerkAuthValue()
    : useLegacyAuthValue();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
