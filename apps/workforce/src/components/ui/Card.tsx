import type { CSSProperties, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  elev?: boolean;     // elevated background (--ink-3)
  scan?: boolean;     // adds scan-line overlay
  lift?: boolean;     // hover lift transition
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export function Card({ children, elev, scan, lift, className, style, onClick }: Props) {
  const cls = ['card', elev && 'elev', scan && 'scan', lift && 'lift', className]
    .filter(Boolean)
    .join(' ');
  return (
    <div
      className={cls}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
