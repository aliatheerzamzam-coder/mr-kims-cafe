import { useState } from 'react';
import type { FormEvent } from 'react';
import { Card, SlashLabel } from '@/components/ui';
import { useAuth } from './AuthContext';

export function LoginScreen() {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    setError(null);
    const result = await login(password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      setPassword('');
    }
    // success → AuthProvider flips status, AuthGuard re-renders
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24
      }}
    >
      <Card
        scan
        style={{
          padding: 40,
          width: '100%',
          maxWidth: 420,
          background: 'var(--ink-2)',
          borderTop: '2px solid var(--mk-green)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 48,
              height: 48,
              margin: '0 auto 14px',
              borderRadius: 12,
              background: 'var(--mk-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontWeight: 900,
              color: 'var(--ink-0)',
              fontSize: 20,
              boxShadow: '0 6px 18px rgba(54,125,77,0.4)'
            }}
            aria-hidden
          >
            ▣
          </div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>· AI WORKFORCE OS</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.01em' }}>
            <SlashLabel ko="오피스 로그인" en="OFFICE LOGIN" />
          </h1>
          <p
            style={{
              color: 'var(--fg-soft)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11.5,
              marginTop: 10,
              letterSpacing: '0.02em'
            }}
          >
            본사 운영 비밀번호로 로그인하세요.
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate>
          <label
            htmlFor="workforce-pw"
            className="mono"
            style={{
              display: 'block',
              fontSize: 10.5,
              color: 'var(--fg-soft)',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: 8
            }}
          >
            password
          </label>
          <input
            id="workforce-pw"
            type="password"
            autoComplete="current-password"
            autoFocus
            disabled={busy}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'login-error' : undefined}
            style={{
              width: '100%',
              background: 'var(--ink-3)',
              border: `1px solid ${error ? 'var(--st-danger)' : 'var(--line)'}`,
              borderRadius: 10,
              padding: '12px 14px',
              outline: 0,
              fontSize: 14,
              fontFamily: 'var(--font-mono)',
              color: 'var(--fg)',
              letterSpacing: '0.08em'
            }}
          />

          {error && (
            <div
              id="login-error"
              role="alert"
              className="fade-in"
              style={{
                marginTop: 12,
                padding: '10px 12px',
                background: 'rgba(244,113,113,0.1)',
                border: '1px solid rgba(244,113,113,0.3)',
                borderRadius: 8,
                color: 'var(--st-danger)',
                fontSize: 12,
                fontFamily: 'var(--font-mono)'
              }}
            >
              ✕ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || !password}
            style={{
              width: '100%',
              marginTop: 18,
              padding: '12px 16px',
              justifyContent: 'center',
              opacity: busy || !password ? 0.6 : 1
            }}
          >
            {busy ? '확인 중…' : '로그인 / Sign in →'}
          </button>
        </form>

        <div
          className="mono"
          style={{
            marginTop: 22,
            paddingTop: 16,
            borderTop: '1px solid var(--line)',
            fontSize: 10.5,
            color: 'var(--fg-faint)',
            textAlign: 'center',
            letterSpacing: '0.06em'
          }}
        >
          mrkimscafe.com · workforce
        </div>
      </Card>
    </main>
  );
}
