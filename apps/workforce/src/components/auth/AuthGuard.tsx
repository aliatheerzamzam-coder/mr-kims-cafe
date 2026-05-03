import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { LoginScreen } from './LoginScreen';

interface Props {
  children: ReactNode;
}

/**
 * Renders a tiny boot splash while the saved token is being validated,
 * the LoginScreen when no valid session exists, or the protected app.
 */
export function AuthGuard({ children }: Props) {
  const { status } = useAuth();

  if (status === 'unknown') return <BootSplash />;
  if (status === 'unauthenticated') return <LoginScreen />;
  return <>{children}</>;
}

function BootSplash() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--fg-soft)'
      }}
    >
      <div className="mono fade-in" style={{ fontSize: 11, letterSpacing: '0.18em' }}>
        ◐ verifying session
        <span className="caret" style={{ height: '0.8em', width: '0.4em' }} />
      </div>
    </main>
  );
}
