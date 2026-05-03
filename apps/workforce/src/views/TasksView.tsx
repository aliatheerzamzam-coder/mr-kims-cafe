import { useState } from 'react';
import { Avatar, Card } from '@/components/ui';
import { AGENTS, agentById, colorFor } from '@/lib/data';
import { Workforce, ApiError, type Task } from '@/lib/api';
import { useTasks } from '@/lib/useLiveData';
import { useChat } from '@/components/chat/ChatContext';

type Status = 'todo' | 'in_progress' | 'done';

const COLUMNS: Array<{ status: Status; label_ko: string; label_en: string; color: string }> = [
  { status: 'todo',        label_ko: '할 일',     label_en: 'TO DO',       color: 'var(--fg-soft)' },
  { status: 'in_progress', label_ko: '진행 중',   label_en: 'IN PROGRESS', color: 'var(--st-busy)' },
  { status: 'done',        label_ko: '완료',      label_en: 'DONE',        color: 'var(--mk-green-glow)' },
];

function fmtAgo(ms: number): string {
  const d = Date.now() - ms;
  if (d < 60_000) return '방금';
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}분 전`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}시간 전`;
  return new Date(ms).toLocaleDateString('ko-KR');
}

export default function TasksView() {
  const { data, refresh, error } = useTasks();
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const tasks = data?.tasks ?? [];

  async function setStatus(id: number, status: Status) {
    setBusy(true);
    setErr(null);
    try {
      await Workforce.setTaskStatus(id, status);
      refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : '상태 변경 실패');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('이 작업을 삭제하시겠습니까?')) return;
    setBusy(true);
    setErr(null);
    try {
      await Workforce.deleteTask(id);
      refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : '삭제 실패');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 1500, margin: '0 auto' }}>
      <header style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">⌘ 작업 / tasks</div>
          <h1 style={{ fontSize: 30, fontWeight: 900, margin: '8px 0 4px' }}>작업 보드</h1>
          <p style={{ color: 'var(--fg-mid)', fontFamily: 'var(--font-mono)', fontSize: 13, margin: 0 }}>
            직원에게 작업을 배정하고, "AI에게 위임" 시 자동으로 실행 계획을 받아옵니다.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          ⊕ 새 작업
        </button>
      </header>

      {(err || error) && (
        <div role="alert" style={{ color: '#ffb0b0', fontSize: 12, fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
          ⚠ {err || error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.status);
          return (
            <Card key={col.status} style={{ padding: 14, minHeight: 480 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
                <span className="mono" style={{ fontSize: 11, color: col.color, letterSpacing: '0.12em' }}>
                  ▮ {col.label_en}
                </span>
                <span style={{ fontSize: 14, fontWeight: 800 }}>{col.label_ko}</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--fg-faint)', marginLeft: 'auto' }}>
                  {colTasks.length}
                </span>
              </div>

              {colTasks.length === 0 && (
                <div style={{ color: 'var(--fg-faint)', fontSize: 12, padding: '8px 4px' }}>비어있음</div>
              )}

              {colTasks.map(t => (
                <TaskCard key={t.id} task={t} busy={busy} onAdvance={s => setStatus(t.id, s)} onDelete={() => remove(t.id)} />
              ))}
            </Card>
          );
        })}
      </div>

      {showCreate && (
        <CreateTaskModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function TaskCard({
  task,
  busy,
  onAdvance,
  onDelete,
}: {
  task: Task;
  busy: boolean;
  onAdvance: (s: Status) => void;
  onDelete: () => void;
}) {
  const a = agentById[task.assignee_id];
  const { open } = useChat();

  const next: Status | null =
    task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : null;
  const back: Status | null = task.status === 'done' ? 'in_progress' : task.status === 'in_progress' ? 'todo' : null;

  return (
    <div
      style={{
        background: 'var(--ink-3)',
        border: '1px solid var(--line)',
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{task.title}</div>
      {task.detail && (
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--fg-soft)',
            marginBottom: 8,
            whiteSpace: 'pre-wrap',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {task.detail}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        {a && <Avatar initials={a.initials} background={colorFor(a)} size="sm" />}
        <span style={{ fontSize: 11, fontWeight: 700 }}>{a?.role_ko ?? task.assignee_id}</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--fg-faint)', marginLeft: 'auto' }}>
          {fmtAgo(task.updated_at)}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {task.meeting_id && (
          <button
            className="btn btn-ghost"
            onClick={() => open(task.assignee_id)}
            style={{ padding: '4px 8px', fontSize: 10.5 }}
            title="1:1 상담 열기"
          >
            💬 채팅
          </button>
        )}
        {back && (
          <button
            className="btn btn-ghost"
            disabled={busy}
            onClick={() => onAdvance(back)}
            style={{ padding: '4px 8px', fontSize: 10.5 }}
          >
            ←
          </button>
        )}
        {next && (
          <button
            className="btn btn-ghost"
            disabled={busy}
            onClick={() => onAdvance(next)}
            style={{ padding: '4px 8px', fontSize: 10.5, color: 'var(--mk-green-glow)' }}
          >
            {next === 'done' ? '완료 →' : '진행 →'}
          </button>
        )}
        <button
          className="btn btn-ghost"
          disabled={busy}
          onClick={onDelete}
          style={{ padding: '4px 8px', fontSize: 10.5, color: 'var(--fg-faint)', marginLeft: 'auto' }}
          title="삭제"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function CreateTaskModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [assigneeId, setAssigneeId] = useState('cpo');
  const [delegate, setDelegate] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!title.trim()) {
      setErr('제목을 입력하세요');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await Workforce.createTask({
        title: title.trim(),
        detail: detail.trim() || undefined,
        assignee_id: assigneeId,
        delegate,
      });
      onCreated();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : '생성 실패');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--ink-1)',
          border: '1px solid var(--line-strong)',
          borderRadius: 14,
          padding: 24,
          width: 'min(560px, 100%)',
        }}
      >
        <div className="eyebrow">⊕ 새 작업</div>
        <h2 style={{ fontSize: 20, fontWeight: 900, margin: '6px 0 14px' }}>작업 생성</h2>

        <label style={{ display: 'block', marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-soft)', marginBottom: 4 }}>제목 *</div>
          <input value={title} onChange={e => setTitle(e.target.value)} className="wf-input" />
        </label>
        <label style={{ display: 'block', marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-soft)', marginBottom: 4 }}>세부 (선택)</div>
          <textarea value={detail} onChange={e => setDetail(e.target.value)} rows={4} className="wf-input" />
        </label>
        <label style={{ display: 'block', marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-soft)', marginBottom: 4 }}>담당 직원 *</div>
          <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="wf-input">
            {AGENTS.map(a => (
              <option key={a.id} value={a.id}>
                {a.role_ko} ({a.role_en})
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <input type="checkbox" checked={delegate} onChange={e => setDelegate(e.target.checked)} />
          <span style={{ fontSize: 12 }}>
            지금 AI에게 위임 — 즉시 실행 계획을 받습니다 (실제 Anthropic 호출, 5~20초)
          </span>
        </label>

        {err && (
          <div role="alert" style={{ color: '#ffb0b0', fontSize: 12, marginBottom: 12 }}>
            ⚠ {err}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
            취소
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? '생성 중…' : '생성'}
          </button>
        </div>

        <style>{`
          .wf-input {
            width: 100%;
            background: var(--ink-2);
            border: 1px solid var(--line);
            border-radius: 8px;
            padding: 9px 12px;
            color: inherit;
            font-size: 13px;
            outline: 0;
            font-family: inherit;
          }
        `}</style>
      </div>
    </div>
  );
}
