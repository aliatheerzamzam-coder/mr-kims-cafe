import type { CSSProperties, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  variant?: 'default' | 'green';
  style?: CSSProperties;
  className?: string;
}

export function Chip({ children, variant = 'default', style, className }: Props) {
  const cls = ['chip', variant === 'green' ? 'green' : '', className].filter(Boolean).join(' ');
  return <span className={cls} style={style}>{children}</span>;
}
