type Size = 'sm' | 'md' | 'lg' | 'xl';

interface Props {
  initials: string;
  background: string;     // CSS color or gradient (typically team color)
  size?: Size;
  title?: string;
}

export function Avatar({ initials, background, size = 'md', title }: Props) {
  const cls = size === 'md' ? 'avatar' : `avatar ${size}`;
  return (
    <span className={cls} style={{ background }} title={title} aria-label={title ?? `avatar ${initials}`}>
      {initials}
    </span>
  );
}
