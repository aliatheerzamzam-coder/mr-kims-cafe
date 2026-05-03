/**
 * Tiny REST client for /api/workforce/*. All requests automatically attach
 * x-workforce-token from localStorage and throw a typed error on non-2xx.
 */
import { getWorkforceToken } from '@/components/auth/AuthContext';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getWorkforceToken();
  const r = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-workforce-token': token } : {}),
    },
    body: body == null ? undefined : JSON.stringify(body),
  });
  let data: unknown = null;
  try {
    data = await r.json();
  } catch {
    /* empty body OK */
  }
  if (!r.ok) {
    const msg = (data as { error?: string } | null)?.error || `HTTP ${r.status}`;
    throw new ApiError(r.status, msg);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};

/* ─── Domain types ─────────────────────────────────────────────────────── */

export interface MeetingMessage {
  role: 'user' | 'agent';
  team_id: string | null;
  content: string;
  created_at: number;
}

export interface Meeting {
  id: string;
  type: 'ask' | 'multi' | 'report';
  team_ids: string[];
  topic: string | null;
  status: 'running' | 'done' | 'failed';
  error: string | null;
  created_at: number;
  updated_at: number;
  messages: MeetingMessage[];
}

export interface Kpis {
  total_agents: number;
  meetings_24h: number;
  agent_replies_24h: number;
  live_meetings: number;
  tasks_open: number;
  tasks_done_24h: number;
  approvals_pending: number;
}

export type ActivityItem =
  | { kind: 'meeting'; t: number; ref: string; type: 'ask' | 'multi' | 'report'; topic: string | null; status: string; team_ids: string[] }
  | { kind: 'task'; t: number; ref: string; title: string; assignee_id: string; status: string }
  | { kind: 'approval'; t: number; ref: string; title: string; assignee_id: string; status: string };

export interface Approval {
  id: number;
  title: string;
  detail: string | null;
  category: string | null;
  amount_iqd: number | null;
  requested_by: string | null;
  assignee_id: string;
  status: 'pending' | 'approved' | 'rejected';
  decision_note: string | null;
  created_at: number;
  decided_at: number | null;
}

export interface Task {
  id: number;
  title: string;
  detail: string | null;
  assignee_id: string;
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  meeting_id: string | null;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
}

/* ─── Endpoints ────────────────────────────────────────────────────────── */

export const Workforce = {
  // 1:1 chat
  startChat: (agent_id: string, prompt: string) =>
    api.post<{ meeting_id: string; agent_id: string }>('/api/workforce/chat/start', { agent_id, prompt }),
  sendMessage: (meeting_id: string, agent_id: string, prompt: string) =>
    api.post<{ meeting_id: string }>(`/api/workforce/chat/${meeting_id}/message`, { agent_id, prompt }),
  getMeeting: (meeting_id: string) =>
    api.get<Meeting>(`/api/workforce/chat/${meeting_id}`),

  // Round-table
  startMeeting: (agent_ids: string[], topic: string) =>
    api.post<{ meeting_id: string }>('/api/workforce/meeting/start', { agent_ids, topic }),
  listMeetings: (limit = 20) =>
    api.get<{ meetings: Omit<Meeting, 'messages' | 'error'>[] }>(`/api/workforce/meetings?limit=${limit}`),

  // KPIs / activity
  kpis: () => api.get<Kpis>('/api/workforce/kpis'),
  activity: (limit = 30) =>
    api.get<{ items: ActivityItem[] }>(`/api/workforce/activity?limit=${limit}`),

  // Approvals
  listApprovals: (status?: 'pending' | 'approved' | 'rejected') =>
    api.get<{ approvals: Approval[] }>(
      `/api/workforce/approvals${status ? `?status=${status}` : ''}`,
    ),
  createApproval: (input: {
    title: string;
    detail?: string;
    category?: string;
    amount_iqd?: number;
    requested_by?: string;
    assignee_id: string;
  }) => api.post<{ id: number }>('/api/workforce/approvals', input),
  decideApproval: (id: number, decision: 'approved' | 'rejected', note?: string) =>
    api.post<{ success: true }>(`/api/workforce/approvals/${id}/decide`, { decision, note }),

  // Tasks
  listTasks: (status?: 'todo' | 'in_progress' | 'done' | 'cancelled') =>
    api.get<{ tasks: Task[] }>(`/api/workforce/tasks${status ? `?status=${status}` : ''}`),
  createTask: (input: {
    title: string;
    detail?: string;
    assignee_id: string;
    delegate?: boolean;
  }) => api.post<{ id: number; meeting_id: string | null }>('/api/workforce/tasks', input),
  setTaskStatus: (id: number, status: 'todo' | 'in_progress' | 'done' | 'cancelled') =>
    api.post<{ success: true }>(`/api/workforce/tasks/${id}/status`, { status }),
  deleteTask: (id: number) => api.del<{ success: true }>(`/api/workforce/tasks/${id}`),
};
