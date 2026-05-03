import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgentCard } from '@/components/ui';
import { useChat } from '@/components/chat';
import { AGENTS, TEAMS, agentsByTeam } from '@/lib/data';
import type { Agent, TeamId } from '@/lib/types';

type Filter = 'all' | TeamId;

export default function DirectoryView() {
  const [filter, setFilter] = useState<Filter>('all');
  const navigate = useNavigate();
  const { open: openChat } = useChat();

  const visibleTeams = filter === 'all' ? TEAMS : TEAMS.filter(t => t.id === filter);

  const onOpen = (agent: Agent) => openChat(agent.id);
  const onMeet = (agent: Agent) => {
    void agent;
    navigate('/meetings');
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow">▦ 직원 디렉토리</div>
        <h1
          style={{
            fontSize: 30,
            fontWeight: 900,
            margin: '8px 0 4px',
            letterSpacing: '-0.015em'
          }}
        >
          AI 직원들 <span style={{ color: 'var(--fg-soft)', fontWeight: 700 }}>/ Agents</span>
        </h1>
        <p
          style={{
            color: 'var(--fg-mid)',
            fontSize: 14,
            margin: 0,
            fontFamily: 'var(--font-mono)'
          }}
        >
          {AGENTS.length}명 · {TEAMS.length} teams · 클릭하면 1:1 채팅이 열립니다.
        </p>
      </div>

      {/* Team filters */}
      <div
        role="tablist"
        aria-label="팀 필터"
        style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}
      >
        <button
          role="tab"
          aria-selected={filter === 'all'}
          onClick={() => setFilter('all')}
          className="btn"
          style={{
            background: filter === 'all' ? 'var(--mk-green)' : 'var(--ink-3)',
            color: filter === 'all' ? 'var(--ink-0)' : 'var(--fg-mid)',
            border:
              filter === 'all'
                ? '1px solid var(--mk-green-light)'
                : '1px solid var(--line)',
            padding: '8px 14px',
            fontSize: 12,
            transform: 'none'
          }}
        >
          전체 / All
        </button>
        {TEAMS.map(t => {
          const active = filter === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(t.id)}
              className="btn"
              style={{
                background: active ? 'var(--ink-4)' : 'var(--ink-3)',
                border: active ? `1px solid ${t.color}` : '1px solid var(--line)',
                color: active ? t.color : 'var(--fg-mid)',
                padding: '8px 14px',
                fontSize: 12,
                transform: 'none'
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)' }} aria-hidden>
                {t.glyph}
              </span>
              {t.name_ko}{' '}
              <span style={{ color: 'var(--fg-faint)', fontSize: 10, marginLeft: 4 }}>
                {t.name_en}
              </span>
            </button>
          );
        })}
      </div>

      {visibleTeams.map(t => {
        const members = agentsByTeam(t.id);
        return (
          <section key={t.id} style={{ marginBottom: 32 }}>
            <header
              style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}
            >
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: t.color,
                  color: 'var(--ink-0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 900,
                  fontSize: 14
                }}
                aria-hidden
              >
                {t.glyph}
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>
                {t.name_ko}{' '}
                <span style={{ color: 'var(--fg-soft)', fontWeight: 700, fontSize: 14 }}>
                  / {t.name_en}
                </span>
              </h2>
              <span
                className="mono"
                style={{ fontSize: 11, color: 'var(--fg-soft)', marginLeft: 6 }}
              >
                · {members.length}명
              </span>
              <span
                style={{
                  flex: 1,
                  height: 1,
                  background: 'var(--line)',
                  marginLeft: 8
                }}
              />
              <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 11 }}>
                ⊕ 직원 추가
              </button>
            </header>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 12
              }}
            >
              {members.map(a => (
                <AgentCard key={a.id} agent={a} onOpen={onOpen} onMeet={onMeet} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
