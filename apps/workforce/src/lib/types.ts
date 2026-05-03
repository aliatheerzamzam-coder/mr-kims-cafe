/**
 * Domain types — shapes shared across components, views, and seed data.
 * Mirrors the structure in design_handoff_ai_workforce/data{,2}.jsx.
 */

export type AgentStatus = 'online' | 'busy' | 'thinking' | 'offline';

export type TeamId =
  | 'exec'
  | 'product'
  | 'engineering'
  | 'design'
  | 'marketing'
  | 'sales'
  | 'finance'
  | 'legal';

export interface Team {
  id: TeamId;
  name_ko: string;
  name_en: string;
  glyph: string;
  color: string;
  desc_ko: string;
  desc_en: string;
}

export interface Agent {
  id: string;
  team: TeamId;
  role_ko: string;
  role_en: string;
  initials: string;
  status: AgentStatus;
  model: string;
  tasks: number;
  ctx: number;
  reports?: string[];      // direct reports (only set for executives)
}

/* ---------- Activity feed ---------- */

export interface ActivityEntry {
  t: string;               // relative time string (e.g. "방금", "5분 전")
  agent: string;           // agent id
  verb_ko: string;
  verb_en: string;
  tag: TeamId;
  icon: string;
}

/* ---------- Meetings ---------- */

export interface ActiveMeeting {
  id: string;
  topic_ko: string;
  topic_en: string;
  started: string;         // relative time since start
  participants: string[];  // agent ids
  chair: string;           // agent id
}

export interface MeetingScriptLine {
  from: string;            // agent id
  ms: number;              // cumulative ms from meeting start
  text_ko: string;
  text_en: string;
}

export type MeetingScript = MeetingScriptLine[];

/* ---------- 1:1 chat ---------- */

export interface ChatMessage {
  from: string;            // agent id; founder messages use 'me'
  text_ko: string;
  text_en: string;
  t: string;               // wall-clock or relative time
}

/* ---------- KPI ---------- */

export interface Kpi {
  label_ko: string;
  label_en: string;
  value: string;
  trend?: string;
  sub_ko?: string;
  sub_en?: string;
}

/* ---------- Integrations ---------- */

export type IntegrationStatus = 'connected' | 'needs_auth' | 'error' | 'disconnected';

export interface Integration {
  id: string;
  name: string;
  cat: string;             // category label (KO)
  glyph: string;
  color: string;
  status: IntegrationStatus;
  ko: string;              // short description KO
  en: string;              // short description EN
  events: number;
  last: string;            // relative time of last event
  scopes: string[];
}

/* ---------- HR / Performance ---------- */

export type PerformanceStatus = 'stellar' | 'strong' | 'ok' | 'at_risk';

export interface PerformanceRecord {
  score: number;           // 0–100
  tasks: number;
  fails: number;
  tokens: number;
  cost: number;            // USD
  trend: string;           // e.g. "+4", "-6", "0"
  strengths: string[];
  weaknesses: string[];
  status: PerformanceStatus;
}

/* ---------- Audit log ---------- */

export type AuditSeverity = 'info' | 'warning' | 'high' | 'critical';
export type AuditResult   = 'ok' | 'pending' | 'fail' | 'throttle';

export interface AuditEntry {
  t: string;
  actor: string;           // agent id or 'system'
  action: string;          // dotted verb, e.g. "github.pr.merge"
  target: string;
  result: AuditResult;
  severity: AuditSeverity;
  ip: string;
  approval_id?: string;
}

/* ---------- Approvals ---------- */

export type ApprovalRisk = 'low' | 'medium' | 'high';

export interface Approval {
  id: string;
  title_ko: string;
  title_en: string;
  requester: string;       // agent id
  amount: number;
  currency: string;
  type: string;
  risk: ApprovalRisk;
  requested: string;       // relative time
  rationale_ko: string;
  rationale_en: string;
  impact_ko: string;
  needs: string[];         // approver requirements (display strings)
}

/* ---------- Knowledge base ---------- */

export interface KnowledgeDoc {
  id: string;
  type: string;            // category label (KO)
  title_ko: string;
  title_en: string;
  owner: string;           // agent id
  updated: string;
  size: string;
  access: string;          // comma-separated team ids or "all"
  pinned?: boolean;
}

/* ---------- Tasks ---------- */

export type TaskStatus = 'backlog' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title_ko: string;
  title_en: string;
  status: TaskStatus;
  assignee: string;        // agent id
  due: string;             // display string
  priority: TaskPriority;
}

/* ---------- Sidebar nav ---------- */

export type NavGroup = 'main' | 'ops' | 'admin';

export interface NavItem {
  id: string;
  ko: string;
  en: string;
  icon: string;
  group: NavGroup;
  badge?: number;
}
