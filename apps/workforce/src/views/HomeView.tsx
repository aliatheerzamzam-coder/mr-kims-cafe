import { useNavigate } from 'react-router-dom';
import { Card, Chip, KpiTile, Avatar } from '@/components/ui';
import { AGENTS, TEAMS, agentById, agentsByTeam, colorFor, teamById } from '@/lib/data';
import { useActivity, useApprovals, useKpis, useTasks } from '@/lib/useLiveData';
import type { Kpi } from '@/lib/types';
import type { ActivityItem } from '@/lib/api';

function fmtAgo(ms: number): string {
  const d = Date.now() - ms;
  if (d < 60_000) return '방금';
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}분 전`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}시간 전`;
  return `${Math.floor(d / 86_400_000)}일 전`;
}

function fmtTokens(replies: number): string {
  const tokens = replies * 1000;
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return String(tokens);
}

export default function HomeView() {
  const navigate = useNavigate();
  const { data: kpis } = useKpis();
  const { data: act } = useActivity(15);
  const { data: approvalsData } = useApprovals('pending');
  const { data: tasksData } = useTasks();

  const kpiCards: Kpi[] = [
    {
      label_ko: '직원',
      label_en: 'Agents',
      value: kpis ? `${kpis.total_agents}` : '—',
      sub_ko: '연결됨',
      sub_en: 'connected',
      trend: '—',
    },
    {
      label_ko: '진행 회의',
      label_en: 'Live Meetings',
      value: kpis ? String(kpis.live_meetings) : '—',
      sub_ko: '실시간',
      sub_en: 'now',
      trend: kpis ? `${kpis.meetings_24h} / 24h` : '—',
    },
    {
      label_ko: '오늘 응답',
      label_en: 'Replies (24h)',
      value: kpis ? String(kpis.agent_replies_24h) : '—',
      sub_ko: '에이전트',
      sub_en: 'agent turns',
      trend: kpis ? `~${fmtTokens(kpis.agent_replies_24h)} tok` : '—',
    },
    {
      label_ko: '결재 대기',
      label_en: 'Approvals',
      value: kpis ? String(kpis.approvals_pending) : '—',
      sub_ko: '대기 중',
      sub_en: 'pending',
      trend: kpis ? `작업 ${kpis.tasks_open}개 진행` : '—',
    },
  ];

  const liveMeetings = (act?.items ?? []).filter(
    i => i.kind === 'meeting' && i.status === 'running',
  );
  const pendingApprovals = approvalsData?.approvals ?? [];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow">▮ 오늘의 브리핑 · daily briefing</div>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 900,
            margin: '8px 0 4px',
            letterSpacing: '-0.015em',
          }}
        >
          좋은 아침입니다, 창업자님.
        </h1>
        <p
          style={{
            color: 'var(--fg-mid)',
            fontSize: 14,
            margin: 0,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.01em',
          }}
        >
          {kpis
            ? `직원 ${kpis.total_agents}명 · 24시간 안 회의 ${kpis.meetings_24h}건 · 진행 ${kpis.live_meetings}건 · 결재 대기 ${kpis.approvals_pending}건`
            : '데이터 로딩 중…'}
        </p>
      </div>

      {/* KPI grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 28,
        }}
      >
        {kpiCards.map((k, i) => (
          <KpiTile key={i} k={k} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        {/* LEFT — activity feed */}
        <Card style={{ padding: 22 }}>
          <div className="sec-h">
            <div className="sec-title">
              <span className="ko">활동 피드</span>
              <span className="en">▶ activity feed · live</span>
            </div>
            <span className="chip green">
              <span className="status-dot online" /> 실시간
            </span>
          </div>

          {(act?.items ?? []).length === 0 ? (
            <div style={{ padding: '20px 0', color: 'var(--fg-soft)', fontSize: 13 }}>
              아직 활동 기록이 없습니다. 회의실/작업/결재를 만들면 여기 표시됩니다.
            </div>
          ) : (
            (act?.items ?? []).slice(0, 12).map((item, i, arr) => (
              <ActivityRow
                key={`${item.kind}-${item.ref}-${i}`}
                item={item}
                divider={i < arr.length - 1}
                onMeetingClick={() => navigate('/meetings')}
                onTaskClick={() => navigate('/tasks')}
                onApprovalClick={() => navigate('/approvals')}
              />
            ))
          )}

          <button
            className="btn btn-ghost"
            style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}
            onClick={() => navigate('/audit')}
          >
            전체 로그 보기 →
          </button>
        </Card>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Live meetings */}
          <Card style={{ padding: 22 }}>
            <div className="sec-h">
              <div className="sec-title">
                <span className="ko">진행 중 회의</span>
                <span className="en">◯ live meetings</span>
              </div>
              <button
                className="btn btn-primary"
                style={{ padding: '7px 12px', fontSize: 11 }}
                onClick={() => navigate('/meetings')}
              >
                ⊕ 소집
              </button>
            </div>

            {liveMeetings.length === 0 && (
              <div style={{ color: 'var(--fg-soft)', fontSize: 12, padding: '8px 0' }}>
                현재 진행 중인 회의가 없습니다.
              </div>
            )}
            {liveMeetings.slice(0, 3).map(m => {
              if (m.kind !== 'meeting') return null;
              return (
                <div
                  key={m.ref}
                  className="lift"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate('/meetings')}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && navigate('/meetings')}
                  style={{
                    background: 'var(--ink-3)',
                    border: '1px solid var(--line)',
                    borderLeft: '3px solid var(--mk-green-glow)',
                    borderRadius: 'var(--r-md)',
                    padding: 14,
                    marginBottom: 10,
                    cursor: 'pointer',
                  }}
                >
                  <div className="mono" style={{ fontSize: 10.5, color: 'var(--mk-green-glow)', letterSpacing: '0.12em', marginBottom: 6 }}>
                    ● LIVE · {fmtAgo(m.t)}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>
                    {m.topic ?? '(제목 없음)'}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {m.team_ids.slice(0, 5).map(tid => {
                      const team = teamById[tid] || { name_ko: tid, color: 'var(--fg-soft)' };
                      return (
                        <span
                          key={tid}
                          className="mono"
                          style={{ fontSize: 10, color: team.color, padding: '2px 8px', border: `1px solid ${team.color}`, borderRadius: 999 }}
                        >
                          {team.name_ko}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Pending approvals */}
          <Card style={{ padding: 22 }}>
            <div className="sec-h">
              <div className="sec-title">
                <span className="ko">결재 대기</span>
                <span className="en">⌬ pending approvals</span>
              </div>
              <button
                className="btn btn-ghost"
                style={{ padding: '6px 10px', fontSize: 11 }}
                onClick={() => navigate('/approvals')}
              >
                전체 →
              </button>
            </div>
            {pendingApprovals.length === 0 ? (
              <div style={{ color: 'var(--fg-soft)', fontSize: 12, padding: '8px 0' }}>
                대기 중인 결재가 없습니다.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingApprovals.slice(0, 4).map((p, i) => {
                  const a = agentById[p.assignee_id];
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        background: 'var(--ink-3)',
                        borderRadius: 10,
                        border: '1px solid var(--line)',
                      }}
                    >
                      <span
                        className="mono"
                        style={{
                          width: 22,
                          fontSize: 11,
                          color: 'var(--fg-faint)',
                          textAlign: 'center',
                        }}
                      >
                        0{i + 1}
                      </span>
                      {a && (
                        <Avatar
                          initials={a.initials}
                          background={colorFor(a)}
                          size="sm"
                          title={a.role_ko}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{p.title}</div>
                        <div
                          style={{
                            fontSize: 10.5,
                            color: 'var(--fg-soft)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {a?.role_ko ?? p.assignee_id} · {fmtAgo(p.created_at)}
                        </div>
                      </div>
                      {p.category && <Chip>{p.category}</Chip>}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Teams glance */}
      <div style={{ marginTop: 28 }}>
        <div className="sec-h">
          <div className="sec-title">
            <span className="ko">팀 현황</span>
            <span className="en">▦ teams</span>
          </div>
          {tasksData && (
            <span className="mono" style={{ color: 'var(--fg-soft)', fontSize: 11 }}>
              {tasksData.tasks.length}개 작업 추적 중
            </span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {TEAMS.map(t => {
            const members = agentsByTeam(t.id);
            return (
              <Card key={t.id} lift style={{ padding: 16, borderTop: `2px solid ${t.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span className="mono" style={{ fontSize: 16, color: t.color }} aria-hidden>
                    {t.glyph}
                  </span>
                  <span style={{ fontWeight: 900, fontSize: 14 }}>{t.name_ko}</span>
                  <span
                    className="mono"
                    style={{
                      fontSize: 10,
                      color: 'var(--fg-faint)',
                      marginLeft: 'auto',
                    }}
                  >
                    {t.name_en.toLowerCase()}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: 'var(--fg-soft)',
                    marginBottom: 10,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {t.desc_ko}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span className="mono" style={{ fontSize: 22, fontWeight: 900 }}>
                    {members.length}
                  </span>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--fg-soft)' }}>
                    명
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Footer aside (count of agents to satisfy import) */}
      <div style={{ marginTop: 16, color: 'var(--fg-faint)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
        총 {AGENTS.length}명의 직원 · 페르소나 8개 백엔드에 매핑
      </div>
    </div>
  );
}

/* ── Activity row ─────────────────────────────────────────────────────── */

function ActivityRow({
  item,
  divider,
  onMeetingClick,
  onTaskClick,
  onApprovalClick,
}: {
  item: ActivityItem;
  divider: boolean;
  onMeetingClick: () => void;
  onTaskClick: () => void;
  onApprovalClick: () => void;
}) {
  const time = fmtAgo(item.t);
  const onClick =
    item.kind === 'meeting' ? onMeetingClick : item.kind === 'task' ? onTaskClick : onApprovalClick;

  let glyph = '·';
  let title = '';
  let subtitle = '';
  let color = 'var(--fg-soft)';

  if (item.kind === 'meeting') {
    glyph = item.type === 'multi' ? '◯' : '◐';
    title = item.topic ?? '(제목 없음)';
    subtitle = `${item.team_ids.map(t => teamById[t]?.name_ko ?? t).join(', ')} · ${item.status}`;
    color = item.status === 'running' ? 'var(--mk-green-glow)' : 'var(--fg-mid)';
  } else if (item.kind === 'task') {
    glyph = item.status === 'done' ? '✓' : item.status === 'in_progress' ? '◑' : '□';
    title = item.title;
    const a = agentById[item.assignee_id];
    subtitle = `${a?.role_ko ?? item.assignee_id} · ${item.status}`;
    color = item.status === 'done' ? 'var(--mk-green-glow)' : 'var(--fg-mid)';
  } else {
    glyph = item.status === 'approved' ? '✓' : item.status === 'rejected' ? '×' : '⌬';
    title = item.title;
    const a = agentById[item.assignee_id];
    subtitle = `${a?.role_ko ?? item.assignee_id} · ${item.status}`;
    color = item.status === 'approved' ? 'var(--mk-green-glow)' : item.status === 'rejected' ? '#ff7676' : 'var(--fg-mid)';
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick()}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        borderBottom: divider ? '1px solid var(--line)' : 'none',
        cursor: 'pointer',
      }}
    >
      <span className="mono" style={{ fontSize: 16, color, width: 22, textAlign: 'center' }} aria-hidden>
        {glyph}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-soft)', fontFamily: 'var(--font-mono)' }}>
          {subtitle}
        </div>
      </div>
      <span className="mono" style={{ fontSize: 11, color: 'var(--fg-faint)' }}>
        {time}
      </span>
    </div>
  );
}
