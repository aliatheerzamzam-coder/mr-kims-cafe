import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

const TOKEN_KEY = 'mk_workforce_token';

type Status = 'unknown' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: Status;
  login: (password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore — incognito mode etc. */
  }
}

export function getWorkforceToken(): string | null {
  return readToken();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('unknown');

  // Validate stored token against the server on boot.
  useEffect(() => {
    const token = readToken();
    if (!token) {
      setStatus('unauthenticated');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/workforce/auth/me', {
          headers: { 'x-workforce-token': token }
        });
        if (cancelled) return;
        if (r.ok) {
          setStatus('authenticated');
        } else {
          writeToken(null);
          setStatus('unauthenticated');
        }
      } catch {
        if (!cancelled) setStatus('unauthenticated');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (password: string): Promise<{ ok: true } | { ok: false; error: string }> => {
      try {
        const r = await fetch('/api/workforce/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        const data = (await r.json().catch(() => ({}))) as {
          success?: boolean;
          token?: string;
          error?: string;
        };
        if (r.ok && data.success && data.token) {
          writeToken(data.token);
          setStatus('authenticated');
          return { ok: true };
        }
        return { ok: false, error: data.error ?? `로그인 실패 (${r.status})` };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : '네트워크 오류' };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    const token = readToken();
    writeToken(null);
    setStatus('unauthenticated');
    if (token) {
      // Best-effort server-side invalidation
      fetch('/api/workforce/auth/logout', {
        method: 'POST',
        headers: { 'x-workforce-token': token }
      }).catch(() => undefined);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, login, logout }),
    [status, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
