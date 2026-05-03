import type { Kpi } from '@/lib/types';

interface Props {
  k: Kpi;
}

export function KpiTile({ k }: Props) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="eyebrow eyebrow-mid" style={{ color: 'var(--fg-soft)' }}>
        {k.label_ko}{' '}
        <span style={{ color: 'var(--fg-faint)' }}>/</span>{' '}
        <span style={{ color: 'var(--fg-faint)' }}>{k.label_en}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
        <span
          className="mono"
          style={{
            fontSize: 30,
            fontWeight: 900,
            color: 'var(--fg)',
            letterSpacing: '-0.02em'
          }}
        >
          {k.value}
        </span>
        {k.trend && (
          <span
            className="mono"
            style={{ fontSize: 11.5, color: 'var(--mk-green-glow)', fontWeight: 700 }}
          >
            {k.trend}
          </span>
        )}
      </div>
      {(k.sub_ko || k.sub_en) && (
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--fg-soft)',
            marginTop: 4,
            fontFamily: 'var(--font-mono)'
          }}
        >
          {k.sub_ko}
          {k.sub_ko && k.sub_en ? ' · ' : ''}
          {k.sub_en}
        </div>
      )}
    </div>
  );
}
