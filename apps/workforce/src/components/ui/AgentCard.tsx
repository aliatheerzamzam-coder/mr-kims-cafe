import { Avatar } from './Avatar';
import { Card } from './Card';
import { Chip } from './Chip';
import { StatusDot } from './StatusDot';
import { colorFor, teamById } from '@/lib/data';
import type { Agent } from '@/lib/types';

interface Props {
  agent: Agent;
  onOpen?: (agent: Agent) => void;
  onMeet?: (agent: Agent) => void;
  compact?: boolean;
}

export function AgentCard({ agent, onOpen, onMeet, compact }: Props) {
  const team = teamById[agent.team];

  return (
    <Card
      lift
      onClick={() => onOpen?.(agent)}
      style={{
        padding: compact ? 14 : 18,
        cursor: 'pointer',
        borderLeft: `3px solid ${team?.color ?? 'transparent'}`
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Avatar initials={agent.initials} background={colorFor(agent)} size="lg" title={agent.role_ko} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <StatusDot status={agent.status} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: team?.color,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}
            >
              {team?.name_en}
            </span>
          </div>
          <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 2 }}>{agent.role_ko}</div>
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--fg-soft)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em'
            }}
          >
            {agent.role_en}
          </div>
        </div>
      </div>

      {!compact && (
        <>
          <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
            <Chip>{agent.model.replace('Claude ', '')}</Chip>
            <Chip>작업 {agent.tasks}</Chip>
            <Chip>ctx {agent.ctx}k</Chip>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <button
              className="btn btn-ghost"
              style={{ flex: 1, fontSize: 11, padding: '7px 12px' }}
              onClick={e => {
                e.stopPropagation();
                onOpen?.(agent);
              }}
            >
              ▸ 1:1 채팅
            </button>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 11, padding: '7px 12px' }}
              onClick={e => {
                e.stopPropagation();
                onMeet?.(agent);
              }}
            >
              ⊕ 회의
            </button>
          </div>
        </>
      )}
    </Card>
  );
}
