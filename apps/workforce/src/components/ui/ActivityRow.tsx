import { Avatar } from './Avatar';
import { agentById, colorFor, teamById } from '@/lib/data';
import type { ActivityEntry } from '@/lib/types';

interface Props {
  entry: ActivityEntry;
  divider?: boolean;
}

export function ActivityRow({ entry, divider = true }: Props) {
  const a = agentById[entry.agent];
  if (!a) return null;
  const team = teamById[a.team];

  return (
    <div
      className="fade-in"
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 0',
        borderBottom: divider ? '1px solid var(--line)' : 0,
        alignItems: 'flex-start'
      }}
    >
      <Avatar initials={a.initials} background={colorFor(a)} title={a.role_ko} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginBottom: 2,
            flexWrap: 'wrap'
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 13.5 }}>{a.role_ko}</span>
          <span style={{ fontSize: 10.5, color: 'var(--fg-faint)', fontFamily: 'var(--font-mono)' }}>·</span>
          <span
            style={{
              fontSize: 11,
              color: 'var(--fg-soft)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em'
            }}
          >
            {a.role_en}
          </span>
          <span
            className="mono"
            style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-faint)' }}
          >
            {entry.t}
          </span>
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--fg)', lineHeight: 1.5 }}>
          <span
            style={{
              color: team?.color,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              marginRight: 6
            }}
          >
            {entry.icon}
          </span>
          {entry.verb_ko}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--fg-soft)',
            marginTop: 2,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.02em'
          }}
        >
          {entry.verb_en}
        </div>
      </div>
    </div>
  );
}
