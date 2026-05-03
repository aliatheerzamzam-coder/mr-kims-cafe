/**
 * Seed data barrel + lookup helpers.
 * Keep helpers pure and synchronous — they run on every render.
 */
import type { Agent, Team } from '@/lib/types';
import { AGENTS } from './agents';
import { TEAMS } from './teams';

export { AGENTS } from './agents';
export { TEAMS } from './teams';
export { ACTIVITY } from './activity';
export { ACTIVE_MEETINGS, MEETING_SCRIPTS } from './meetings';
export { KPIS } from './kpis';
export { CHAT_SEEDS } from './chat-seeds';
export { INTEGRATIONS } from './integrations';
export { PERFORMANCE } from './performance';
export { AUDIT_LOG } from './audit';
export { APPROVALS } from './approvals';
export { KNOWLEDGE_DOCS } from './knowledge';
export { TASKS } from './tasks';

/* ---------- Lookup maps (computed once at module load) ---------- */

export const agentById: Record<string, Agent> = Object.fromEntries(
  AGENTS.map(a => [a.id, a])
);

export const teamById: Record<string, Team> = Object.fromEntries(
  TEAMS.map(t => [t.id, t])
);

/* ---------- Aggregates ---------- */

export function onlineCount(): number {
  return AGENTS.filter(a => a.status === 'online' || a.status === 'thinking').length;
}

export const totalAgents = AGENTS.length;

export function agentsByTeam(teamId: string): Agent[] {
  return AGENTS.filter(a => a.team === teamId);
}

/**
 * Stable color resolver for an agent based on their team.
 * Used for avatar backgrounds, accents, etc.
 */
export function colorFor(agent: Agent): string {
  return teamById[agent.team]?.color ?? 'var(--mk-green)';
}
