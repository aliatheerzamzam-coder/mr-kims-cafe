import { useMemo, useState } from 'react';
import { Card, Chip } from '@/components/ui';
import { agentById, teamById } from '@/lib/data';
import { useActivity } from '@/lib/useLiveData';
import type { ActivityItem } from '@/lib/api';

type Kind = 'all' | 'meeting' | 'task' | 'approval';

function fmtTime(ms: number): string {
  return new Date(ms).toLocaleString('ko-KR', { hour12: false });
}

function describe(item: ActivityItem): { title: string; subtitle: string; color: string } {
  if (item.kind === 'meeting') {
    return {
      title: item.topic || '(제목 없음)',
      subtitle: `${item.type === 'multi' ? '다자' : '1:1'} 회의 · ${item.team_ids.map(t => teamById[t]?.name_ko ?? t).join(', ')} · ${item.status}`,
      color: item.status === 'failed' ? '#ff7676' : item.status === 'running' ? 'var(--mk-green-glow)' : 'var(--fg-mid)',
    };
  }
  if (item.kind === 'task') {
    const a = agentById[item.assignee_id];
    return {
      title: item.title,
      subtitle: `작업 · ${a?.role_ko ?? item.assignee_id} · ${item.status}`,
      color: item.status === 'done' ? 'var(--mk-green-glow)' : 'var(--fg-mid)',
    };
  }
  const a = agentById[item.assignee_id];
  return {
    title: item.title,
    subtitle: `결재 · ${a?.role_ko ?? item.assignee_id} · ${item.status}`,
    color: item.status === 'approved' ? 'var(--mk-green-glow)' : item.status === 'rejected' ? '#ff7676' : 'var(--fg-mid)',
  };
}

export default function AuditView() {
  const [kind, setKind] = useState<Kind>('all');
  const [q, setQ] = useState('');
  const { data, error } = useActivity(100);

  const filtered = useMemo(() => {
    let items = data?.items ?? [];
    if (kind !== 'all') items = items.filter(i => i.kind === kind);
    if (q.trim()) {
      const t = q.toLowerCase();
      items = items.filter(i => {
        const d = describe(i);
        return d.title.toLowerCase().includes(t) || d.subtitle.toLowerCase().includes(t);
      });
    }
    return items;
  }, [data, kind, q]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 18 }}>
        <div className="eyebrow">▦ 감사 로그 / audit log</div>
        <h1 style={{ fontSize: 30, fontWeight: 900, margin: '8px 0 4px' }}>전체 활동</h1>
        <p style={{ color: 'var(--fg-mid)', fontFamily: 'var(--font-mono)', fontSize: 13, margin: 0 }}>
          회의 · 작업 · 결재의 모든 변경 이력. DB에서 직접 조회.
        </p>
      </header>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
        {(['all', 'meeting', 'task', 'approval'] as Kind[]).map(k => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className="btn"
            style={{
              background: kind === k ? 'var(--ink-3)' : 'transparent',
              border: `1px solid ${kind === k ? 'var(--line-strong)' : 'var(--line)'}`,
              color: kind === k ? 'var(--fg)' : 'var(--fg-mid)',
              padding: '6px 14px',
              fontSize: 12,
            }}
          >
            {k === 'all' ? '전체' : k === 'meeting' ? '회의' : k === 'task' ? '작업' : '결재'}
          </button>
        ))}
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="검색…"
          style={{
            marginLeft: 'auto',
            background: 'var(--ink-2)',
            border: '1px solid var(--line)',
            borderRadius: 999,
            padding: '6px 14px',
            fontSize: 12,
            color: 'inherit',
            outline: 0,
            width: 220,
          }}
        />
      </div>

      {error && (
        <div role="alert" style={{ color: '#ffb0b0', fontSize: 12, marginBottom: 12, fontFamily: 'var(--font-mono)' }}>
          ⚠ {error}
        </div>
      )}

      <Card style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 28, color: 'var(--fg-soft)', fontSize: 13 }}>
            {data ? '일치하는 항목이 없습니다.' : '로딩 중…'}
          </div>
        ) : (
          filtered.map((item, i, arr) => {
            const d = describe(item);
            return (
              <div
                key={`${item.kind}-${item.ref}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 18px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 16,
                    color: d.color,
                    width: 22,
                    textAlign: 'center',
                  }}
                  aria-hidden
                >
                  {item.kind === 'meeting' ? '◯' : item.kind === 'task' ? '□' : '⌬'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{d.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-soft)', fontFamily: 'var(--font-mono)' }}>{d.subtitle}</div>
                </div>
                <Chip>{item.kind}</Chip>
                <span className="mono" style={{ fontSize: 11, color: 'var(--fg-faint)', minWidth: 140, textAlign: 'right' }}>
                  {fmtTime(item.t)}
                </span>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
