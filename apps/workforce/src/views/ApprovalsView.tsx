import { useMemo, useState } from 'react';
import { Avatar, Card, Chip } from '@/components/ui';
import { AGENTS, agentById, colorFor } from '@/lib/data';
import { Workforce, ApiError, type Approval } from '@/lib/api';
import { useApprovals } from '@/lib/useLiveData';

type Tab = 'pending' | 'approved' | 'rejected';

function fmtAmount(amount: number | null): string {
  if (!amount) return '';
  return `${amount.toLocaleString()} IQD`;
}

function fmtAgo(ms: number): string {
  const d = Date.now() - ms;
  if (d < 60_000) return '방금';
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}분 전`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}시간 전`;
  return new Date(ms).toLocaleDateString('ko-KR');
}

export default function ApprovalsView() {
  const [tab, setTab] = useState<Tab>('pending');
  const { data, refresh, error } = useApprovals(tab);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const items = data?.approvals ?? [];
  const cur = useMemo(() => items.find(x => x.id === selectedId) ?? items[0] ?? null, [items, selectedId]);

  async function decide(id: number, decision: 'approved' | 'rejected', note?: string) {
    setBusy(true);
    setErr(null);
    try {
      await Workforce.decideApproval(id, decision, note);
      refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : '결정 실패');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 1500, margin: '0 auto' }}>
      <header style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">⊠ 결재 / approvals</div>
          <h1 style={{ fontSize: 30, fontWeight: 900, margin: '8px 0 4px' }}>승인 / Approvals</h1>
          <p style={{ color: 'var(--fg-mid)', fontFamily: 'var(--font-mono)', fontSize: 13, margin: 0 }}>
            결재 항목을 만들어 담당 직원에게 라우팅하고, 승인/반려를 영구 저장합니다.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          ⊕ 새 결재 요청
        </button>
      </header>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['pending', 'approved', 'rejected'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setSelectedId(null);
            }}
            className="btn"
            style={{
              background: tab === t ? 'var(--ink-3)' : 'transparent',
              border: `1px solid ${tab === t ? 'var(--line-strong)' : 'var(--line)'}`,
              color: tab === t ? 'var(--fg)' : 'var(--fg-mid)',
              padding: '6px 14px',
              fontSize: 12,
            }}
          >
            {t === 'pending' ? '대기' : t === 'approved' ? '승인됨' : '반려됨'}
          </button>
        ))}
      </div>

      {(err || error) && (
        <div role="alert" style={{ color: '#ffb0b0', fontSize: 12, fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
          ⚠ {err || error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 16 }}>
        {/* List */}
        <Card style={{ padding: 8 }}>
          {items.length === 0 ? (
            <div style={{ padding: 24, color: 'var(--fg-soft)', fontSize: 13 }}>
              {tab === 'pending' ? '대기 중인 결재가 없습니다.' : `${tab === 'approved' ? '승인된' : '반려된'} 결재가 없습니다.`}
            </div>
          ) : (
            items.map(it => {
              const a = agentById[it.assignee_id];
              const active = cur?.id === it.id;
              return (
                <button
                  key={it.id}
                  onClick={() => setSelectedId(it.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: 12,
                    background: active ? 'var(--ink-3)' : 'transparent',
                    border: '1px solid',
                    borderColor: active ? 'var(--line-strong)' : 'transparent',
                    borderRadius: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    cursor: 'pointer',
                    marginBottom: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {a && <Avatar initials={a.initials} background={colorFor(a)} size="sm" />}
                    <span style={{ fontWeight: 800, fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {it.title}
                    </span>
                    {it.amount_iqd ? <Chip>{fmtAmount(it.amount_iqd)}</Chip> : null}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-soft)', fontFamily: 'var(--font-mono)' }}>
                    {a?.role_ko ?? it.assignee_id} · {fmtAgo(it.created_at)} {it.category && `· ${it.category}`}
                  </div>
                </button>
              );
            })
          )}
        </Card>

        {/* Detail */}
        <Card style={{ padding: 24, minHeight: 360 }}>
          {!cur ? (
            <div style={{ color: 'var(--fg-soft)', fontSize: 13 }}>왼쪽에서 결재를 선택하세요.</div>
          ) : (
            <ApprovalDetail approval={cur} onDecide={decide} busy={busy} />
          )}
        </Card>
      </div>

      {showCreate && (
        <CreateApprovalModal
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

function ApprovalDetail({
  approval,
  onDecide,
  busy,
}: {
  approval: Approval;
  onDecide: (id: number, decision: 'approved' | 'rejected', note?: string) => void;
  busy: boolean;
}) {
  const a = agentById[approval.assignee_id];
  const [note, setNote] = useState('');
  const decided = approval.status !== 'pending';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        {a && <Avatar initials={a.initials} background={colorFor(a)} size="lg" />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{approval.title}</div>
          <div style={{ fontSize: 12, color: 'var(--fg-soft)', fontFamily: 'var(--font-mono)' }}>
            담당 {a?.role_ko ?? approval.assignee_id} · {new Date(approval.created_at).toLocaleString('ko-KR', { hour12: false })}
          </div>
        </div>
        <Chip>{approval.status === 'pending' ? '대기' : approval.status === 'approved' ? '승인됨' : '반려됨'}</Chip>
      </div>

      {(approval.amount_iqd || approval.category || approval.requested_by) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {approval.amount_iqd ? <Chip>{fmtAmount(approval.amount_iqd)}</Chip> : null}
          {approval.category && <Chip>{approval.category}</Chip>}
          {approval.requested_by && <Chip>요청: {approval.requested_by}</Chip>}
        </div>
      )}

      {approval.detail && (
        <div
          style={{
            background: 'var(--ink-3)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            padding: 14,
            fontSize: 13,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            marginBottom: 14,
          }}
        >
          {approval.detail}
        </div>
      )}

      {approval.decision_note && (
        <div
          style={{
            background: 'var(--ink-2)',
            border: '1px dashed var(--line)',
            borderRadius: 10,
            padding: 12,
            fontSize: 12,
            marginBottom: 14,
            color: 'var(--fg-mid)',
          }}
        >
          <div className="mono" style={{ fontSize: 10, color: 'var(--fg-soft)', marginBottom: 4 }}>
            결정 사유
          </div>
          {approval.decision_note}
        </div>
      )}

      {!decided && (
        <>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="결정 사유 (선택)"
            rows={2}
            style={{
              width: '100%',
              background: 'var(--ink-2)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: 10,
              fontSize: 13,
              outline: 0,
              color: 'inherit',
              marginBottom: 12,
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={() => onDecide(approval.id, 'approved', note.trim() || undefined)}
              style={{ padding: '10px 20px' }}
            >
              ✓ 승인
            </button>
            <button
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => onDecide(approval.id, 'rejected', note.trim() || undefined)}
              style={{ padding: '10px 20px', borderColor: 'rgba(255,80,80,0.4)', color: '#ff9090' }}
            >
              × 반려
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function CreateApprovalModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [requestedBy, setRequestedBy] = useState('');
  const [assigneeId, setAssigneeId] = useState('cfo');
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
      await Workforce.createApproval({
        title: title.trim(),
        detail: detail.trim() || undefined,
        category: category.trim() || undefined,
        amount_iqd: amount ? parseInt(amount, 10) : undefined,
        requested_by: requestedBy.trim() || undefined,
        assignee_id: assigneeId,
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
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <div className="eyebrow">⊕ 새 결재</div>
        <h2 style={{ fontSize: 20, fontWeight: 900, margin: '6px 0 14px' }}>결재 요청</h2>

        <Field label="제목 *">
          <input value={title} onChange={e => setTitle(e.target.value)} className="wf-input" />
        </Field>
        <Field label="세부 / 근거">
          <textarea value={detail} onChange={e => setDetail(e.target.value)} className="wf-input" rows={3} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="카테고리">
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="예: 마케팅, 인사" className="wf-input" />
          </Field>
          <Field label="금액 (IQD)">
            <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))} className="wf-input" />
          </Field>
        </div>
        <Field label="요청자">
          <input value={requestedBy} onChange={e => setRequestedBy(e.target.value)} placeholder="예: 매니저 알리" className="wf-input" />
        </Field>
        <Field label="담당 결재자 *">
          <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="wf-input">
            {AGENTS.map(a => (
              <option key={a.id} value={a.id}>
                {a.role_ko} ({a.role_en})
              </option>
            ))}
          </select>
        </Field>

        {err && (
          <div role="alert" style={{ color: '#ffb0b0', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 8 }}>
            ⚠ {err}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: 'var(--fg-soft)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
        {label}
      </div>
      {children}
    </label>
  );
}
