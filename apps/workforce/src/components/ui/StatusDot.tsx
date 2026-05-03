import type { AgentStatus } from '@/lib/types';

const STATUS_LABELS: Record<AgentStatus, { ko: string; en: string }> = {
  online:   { ko: '온라인',   en: 'online' },
  busy:     { ko: '바쁨',     en: 'busy' },
  thinking: { ko: '사고중',   en: 'thinking' },
  offline:  { ko: '오프라인', en: 'offline' }
};

interface DotProps {
  status: AgentStatus;
  className?: string;
}

export function StatusDot({ status, className }: DotProps) {
  return (
    <span
      className={className ? `status-dot ${status} ${className}` : `status-dot ${status}`}
      aria-label={STATUS_LABELS[status].en}
      role="status"
    />
  );
}

interface BadgeProps {
  status: AgentStatus;
}

export function StatusBadge({ status }: BadgeProps) {
  const l = STATUS_LABELS[status];
  return (
    <span className="chip" style={{ padding: '3px 8px', fontSize: 10 }}>
      <StatusDot status={status} />
      {l.ko}
      <span style={{ color: 'var(--fg-faint)' }}>·</span>
      <span style={{ color: 'var(--fg-soft)' }}>{l.en}</span>
    </span>
  );
}
