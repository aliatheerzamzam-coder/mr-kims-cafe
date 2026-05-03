import { Avatar, Card, StatusDot } from '@/components/ui';
import { useChat } from '@/components/chat';
import { AGENTS, TEAMS, agentById, agentsByTeam, colorFor, teamById } from '@/lib/data';
import type { Agent, TeamId } from '@/lib/types';

const C_SUITE_IDS = ['cfo', 'cpo', 'cto', 'cmo', 'cro', 'clo'] as const;

const TEAM_LEAD: Partial<Record<TeamId, string>> = {
  engineering: 'cto',
  marketing:   'cmo',
  sales:       'cro',
  legal:       'clo',
  product:     'pm-1',
  design:      'des-1',
  finance:     'fin-1'
};

export default function OrgView() {
  const { open: openChat } = useChat();
  const ceo = agentById['ceo'];
  const cSuite = AGENTS.filter(a => (C_SUITE_IDS as readonly string[]).includes(a.id));

  return (
    <div style={{ maxWidth: 1500, margin: '0 auto' }}>
      <header style={{ marginBottom: 28 }}>
        <div className="eyebrow">⊞ 조직도</div>
        <h1
          style={{
            fontSize: 30,
            fontWeight: 900,
            margin: '8px 0 4px',
            letterSpacing: '-0.015em'
          }}
        >
          조직 구조{' '}
          <span style={{ color: 'var(--fg-soft)', fontWeight: 700 }}>/ Org Chart</span>
        </h1>
      </header>

      {/* CEO at top */}
      {ceo && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <NodeCard agent={ceo} big accent="var(--mk-green-light)" onOpen={openChat} />
        </div>
      )}
      <Connector height={32} />

      {/* C-suite row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 14,
          flexWrap: 'wrap'
        }}
      >
        {cSuite.map(a => (
          <NodeCard key={a.id} agent={a} accent="var(--line-strong)" onOpen={openChat} />
        ))}
      </div>

      <Connector height={32} />

      {/* Teams below (exec excluded) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
        {TEAMS.filter(t => t.id !== 'exec').map(t => {
          const members = agentsByTeam(t.id);
          const leadId = TEAM_LEAD[t.id];
          const others = members.filter(m => m.id !== leadId);
          return (
            <Card key={t.id} style={{ padding: 14, borderTop: `2px solid ${t.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span
                  style={{ fontFamily: 'var(--font-mono)', color: t.color, fontSize: 16 }}
                  aria-hidden
                >
                  {t.glyph}
                </span>
                <span style={{ fontWeight: 900, fontSize: 13 }}>{t.name_ko}</span>
                <span
                  className="mono"
                  style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--fg-faint)' }}
                >
                  {members.length}명
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {others.map(m => (
                  <button
                    key={m.id}
                    onClick={() => openChat(m.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 10px',
                      background: 'var(--ink-3)',
                      border: '1px solid var(--line)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      color: 'inherit',
                      width: '100%',
                      textAlign: 'left',
                      transition: 'background var(--speed) var(--ease)'
                    }}
                  >
                    <Avatar
                      initials={m.initials}
                      background={colorFor(m)}
                      size="sm"
                      title={m.role_ko}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{m.role_ko}</div>
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--fg-soft)',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        {m.role_en}
                      </div>
                    </div>
                    <StatusDot status={m.status} />
                  </button>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function NodeCard({
  agent,
  big,
  accent,
  onOpen
}: {
  agent: Agent;
  big?: boolean;
  accent?: string;
  onOpen?: (id: string) => void;
}) {
  const team = teamById[agent.team];
  return (
    <button
      className="lift"
      onClick={() => onOpen?.(agent.id)}
      style={{
        background: 'var(--ink-3)',
        border: `1px solid ${accent ?? 'var(--line)'}`,
        borderTop: `2px solid ${team?.color}`,
        borderRadius: 12,
        padding: big ? '14px 18px' : '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        minWidth: big ? 220 : 170,
        cursor: 'pointer',
        fontFamily: 'inherit',
        color: 'inherit',
        textAlign: 'left'
      }}
    >
      <Avatar
        initials={agent.initials}
        background={colorFor(agent)}
        size={big ? 'lg' : 'md'}
        title={agent.role_ko}
      />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusDot status={agent.status} />
          <span style={{ fontSize: big ? 14 : 12.5, fontWeight: 900 }}>{agent.role_ko}</span>
        </div>
        <div
          style={{
            fontSize: big ? 11 : 10.5,
            color: 'var(--fg-soft)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.04em'
          }}
        >
          {agent.role_en}
        </div>
      </div>
    </button>
  );
}

function Connector({ height = 28 }: { height?: number }) {
  return (
    <div
      aria-hidden
      style={{
        width: 1,
        height,
        background: 'var(--line-strong)',
        margin: '0 auto'
      }}
    />
  );
}
