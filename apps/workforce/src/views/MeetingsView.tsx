import { useEffect, useRef, useState } from 'react';
import { Avatar, Card, Chip } from '@/components/ui';
import { AGENTS, colorFor, teamById } from '@/lib/data';
import { Workforce, ApiError, type Meeting } from '@/lib/api';

/* ============================================================
   MeetingsView — real multi-agent round-table
   - User picks a topic + 2~6 participants
   - Backend dispatches the same topic to each agent's team persona
   - We poll /api/workforce/chat/:id every 2s for status + replies
   ============================================================ */

interface ListedMeeting {
  id: string;
  type: 'ask' | 'multi' | 'report';
  team_ids: string[];
  topic: string | null;
  status: string;
  created_at: number;
  updated_at: number;
}

function fmtElapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
}

function fmtAgo(ms: number): string {
  const d = Date.now() - ms;
  if (d < 60_000) return '방금';
  if (d < 3600_000) return `${Math.floor(d / 60_000)}분 전`;
  if (d < 86400_000) return `${Math.floor(d / 3600_000)}시간 전`;
  return `${Math.floor(d / 86400_000)}일 전`;
}

export default function MeetingsView() {
  const [activeId, setActiveId] = useState<string | null>(null);

  if (activeId) {
    return <ActiveRoom meetingId={activeId} onClose={() => setActiveId(null)} />;
  }
  return <Hub onOpen={setActiveId} />;
}

/* ─── Hub ─────────────────────────────────────────────────────────────── */

function Hub({ onOpen }: { onOpen: (id: string) => void }) {
  const [topic, setTopic] = useState('');
  const [picked, setPicked] = useState<string[]>(['ceo', 'cfo', 'cto', 'cmo']);
  const [list, setList] = useState<ListedMeeting[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    try {
      const r = await Workforce.listMeetings(20);
      setList(r.meetings as ListedMeeting[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '회의 목록 로드 실패');
    }
  }

  useEffect(() => {
    let mounted = true;
    refresh();
    const id = window.setInterval(() => { if (mounted) refresh(); }, 5000);
    return () => { mounted = false; window.clearInterval(id); };
  }, []);

  async function start() {
    const t = topic.trim();
    if (!t) {
      setErr('안건을 입력하세요');
      return;
    }
    if (picked.length < 2) {
      setErr('최소 2명을 선택하세요');
      return;
    }
    if (picked.length > 6) {
      setErr('최대 6명까지');
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const r = await Workforce.startMeeting(picked, t);
      onOpen(r.meeting_id);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : '회의 시작 실패');
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <div className="eyebrow">◯ 원탁 회의실</div>
        <h1 style={{ fontSize: 30, fontWeight: 900, margin: '8px 0 4px', letterSpacing: '-0.015em' }}>
          회의실 <span style={{ color: 'var(--fg-soft)', fontWeight: 700 }}>/ Round Table</span>
        </h1>
        <p style={{ color: 'var(--fg-mid)', fontFamily: 'var(--font-mono)', fontSize: 13, margin: 0 }}>
          안건과 참석자를 정하면 각 직원이 자기 시각으로 동시에 답변합니다 (Anthropic API · 실제 호출).
        </p>
      </header>

      <Card style={{ padding: 22, marginBottom: 24 }}>
        <div className="sec-h">
          <div className="sec-title">
            <span className="ko">새 회의 소집</span>
            <span className="en">⊕ Convene</span>
          </div>
        </div>

        <label style={{ display: 'block', marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-soft)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
            안건 / Topic
          </div>
          <textarea
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="예: 라마단 한정 메뉴 가격 결정"
            rows={2}
            style={{
              width: '100%',
              background: 'var(--ink-2)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 14,
              outline: 0,
              color: 'inherit',
              resize: 'vertical',
            }}
          />
        </label>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-soft)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
            참석자 ({picked.length}명) · 2~6명
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {AGENTS.map(a => {
              const on = picked.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => toggle(a.id)}
                  className="lift"
                  aria-pressed={on}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 10px 5px 5px',
                    border: `1px solid ${on ? colorFor(a) : 'var(--line)'}`,
                    background: on ? `color-mix(in srgb, ${colorFor(a)} 18%, transparent)` : 'var(--ink-2)',
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  <Avatar initials={a.initials} background={colorFor(a)} size="sm" />
                  <span style={{ fontWeight: on ? 800 : 600 }}>
                    {a.role_ko}
                    {on && <span aria-hidden style={{ marginLeft: 4, fontWeight: 900 }}>✓</span>}
                  </span>
                </button>
              );
            })}
          </div>
          {(() => {
            const teams = new Set(picked.map(id => AGENTS.find(a => a.id === id)?.team));
            if (teams.size < picked.length) return (
              <div style={{fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-soft)', marginTop: 8}}>
                ※ 같은 팀에서 여러 명 선택해도 응답은 팀당 1회입니다 / Same-team duplicates produce one reply per team
              </div>
            );
            return null;
          })()}
        </div>

        {err && (
          <div role="alert" style={{ color: '#ffb0b0', fontSize: 12, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
            ⚠ {err}
          </div>
        )}

        <button className="btn btn-primary" onClick={start} disabled={loading} style={{ padding: '10px 20px' }}>
          {loading ? '시작 중…' : '▶ 회의 시작 / Start meeting'}
        </button>
      </Card>

      <div className="sec-h">
        <div className="sec-title">
          <span className="ko">최근 회의</span>
          <span className="en">RECENT</span>
        </div>
      </div>

      {list == null && <div style={{ color: 'var(--fg-soft)', fontSize: 13 }}>로딩 중…</div>}
      {list && list.length === 0 && (
        <div style={{ color: 'var(--fg-soft)', fontSize: 13 }}>아직 회의 기록이 없습니다.</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
        {(list ?? []).map(m => (
          <Card
            key={m.id}
            lift
            onClick={() => onOpen(m.id)}
            style={{
              padding: 16,
              cursor: 'pointer',
              borderLeft: `3px solid ${m.status === 'running' ? 'var(--mk-green-glow)' : m.status === 'failed' ? '#ff7676' : 'var(--line-strong)'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
              <span
                className="mono"
                style={{
                  fontSize: 10.5,
                  color: m.status === 'running' ? 'var(--mk-green-glow)' : 'var(--fg-soft)',
                  letterSpacing: '0.12em',
                }}
              >
                {m.status === 'running' ? '● LIVE' : m.status === 'done' ? '○ DONE' : '× FAILED'} · {fmtAgo(m.created_at)}
              </span>
              <Chip>{m.type}</Chip>
            </div>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>
              {m.topic || '(제목 없음)'}
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {m.team_ids.map(tid => {
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
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── Active room ─────────────────────────────────────────────────────── */

function ActiveRoom({ meetingId, onClose }: { meetingId: string; onClose: () => void }) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    async function tick() {
      try {
        const m = await Workforce.getMeeting(meetingId);
        if (cancelled) return;
        setMeeting(m);
        if (m.status === 'running') {
          timer = window.setTimeout(tick, 2000);
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : '폴링 실패');
      }
    }
    tick();
    const t2 = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelled = true;
      if (timer != null) window.clearTimeout(timer);
      window.clearInterval(t2);
    };
  }, [meetingId]);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [meeting?.messages.length]);

  const elapsed = meeting ? now - meeting.created_at : 0;

  // For 'multi' meetings: each team_id corresponds to one expected reply
  const expectedReplies = meeting?.type === 'multi' ? meeting.team_ids.length : 1;
  const receivedReplies = meeting?.messages.filter(m => m.role === 'agent').length ?? 0;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-ghost" onClick={onClose}>
          ← 회의실 목록
        </button>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ marginBottom: 0 }}>
            ● {meeting?.status ?? '…'} · {fmtElapsed(elapsed)}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: '4px 0 0', letterSpacing: '-0.015em' }}>
            {meeting?.topic || '회의 로딩 중…'}
          </h1>
        </div>
        {meeting && (
          <Chip>
            팀 응답 {receivedReplies} / {expectedReplies}
          </Chip>
        )}
      </header>

      {err && (
        <div role="alert" style={{ color: '#ffb0b0', fontSize: 12, fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
          ⚠ {err}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
        <Card style={{ padding: 14 }}>
          <div className="sec-title" style={{ marginBottom: 10 }}>
            <span className="ko">참석</span>
          </div>
          {meeting?.team_ids.map(tid => {
            const team = teamById[tid] || { name_ko: tid, color: 'var(--fg-soft)' };
            const replied = meeting.messages.some(m => m.role === 'agent' && m.team_id === tid);
            return (
              <div
                key={tid}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 0',
                  borderBottom: '1px solid var(--line)',
                  fontSize: 12,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: replied ? 'var(--mk-green-glow)' : team.color,
                    boxShadow: replied ? `0 0 8px ${team.color}` : 'none',
                  }}
                />
                <span style={{ flex: 1, fontWeight: 700 }}>{team.name_ko}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--fg-soft)' }}>
                  {replied ? '응답' : '대기'}
                </span>
              </div>
            );
          })}
        </Card>

        <Card style={{ padding: 18, minHeight: 480 }}>
          <div ref={transcriptRef} style={{ maxHeight: 'calc(100vh - 280px)', overflow: 'auto' }}>
            {meeting?.messages.map((m, i) => {
              if (m.role === 'user') {
                return (
                  <div key={i} style={{ marginBottom: 18, padding: '10px 14px', background: 'var(--ink-3)', borderLeft: '3px solid var(--mk-green)', borderRadius: 6 }}>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--fg-soft)', marginBottom: 4 }}>
                      ◆ 안건 / {new Date(m.created_at).toLocaleTimeString('ko-KR', { hour12: false })}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'pre-wrap' }}>{m.content}</div>
                  </div>
                );
              }
              const team = m.team_id ? teamById[m.team_id] : null;
              const repAgent = AGENTS.find(a => a.team === m.team_id) ?? AGENTS[0];
              return (
                <div key={i} style={{ marginBottom: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    {repAgent && <Avatar initials={repAgent.initials} background={team?.color || 'var(--mk-green)'} size="sm" />}
                    <span style={{ fontWeight: 800, fontSize: 13, color: team?.color }}>
                      {team?.name_ko ?? m.team_id ?? 'AI'}
                    </span>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--fg-faint)', marginLeft: 'auto' }}>
                      {new Date(m.created_at).toLocaleTimeString('ko-KR', { hour12: false })}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.65,
                      whiteSpace: 'pre-wrap',
                      paddingLeft: 32,
                      color: 'var(--fg-mid)',
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}

            {meeting && meeting.status === 'running' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--mk-green-glow)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '10px 0' }}>
                <span className="caret" style={{ height: '0.8em', width: '0.4em' }} />
                팀 응답 수집 중… ({receivedReplies}/{expectedReplies})
              </div>
            )}

            {meeting && meeting.status === 'failed' && meeting.error && (
              <div role="alert" style={{ color: '#ffb0b0', fontSize: 12, padding: '10px 14px', background: 'rgba(255,80,80,0.08)', borderRadius: 6 }}>
                ⚠ {meeting.error}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
