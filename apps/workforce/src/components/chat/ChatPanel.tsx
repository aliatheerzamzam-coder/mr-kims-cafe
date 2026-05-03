import { useEffect, useRef, useState } from 'react';
import { Avatar, Chip, StatusDot } from '@/components/ui';
import { agentById, colorFor, teamById } from '@/lib/data';
import type { Agent } from '@/lib/types';
import { Workforce, ApiError, type Meeting } from '@/lib/api';
import { useChat } from './ChatContext';

interface DisplayMessage {
  id: string;
  from: 'user' | 'agent' | 'error';
  text: string;
  t: string;
}

function fmtTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function ChatPanel() {
  const { agentId, close } = useChat();
  const agent = agentId ? agentById[agentId] : undefined;

  useEffect(() => {
    if (!agentId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [agentId, close]);

  if (!agent) return null;

  return (
    <>
      <div
        onClick={close}
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7,9,10,0.5)',
          zIndex: 170,
          animation: 'fadeIn 0.2s var(--ease) both',
        }}
      />
      <PanelInner agent={agent} onClose={close} />
    </>
  );
}

function PanelInner({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<number | null>(null);

  // Reset when agent switches
  useEffect(() => {
    setMessages([]);
    setMeetingId(null);
    setThinking(false);
    setError(null);
    setInput('');
    if (pollTimerRef.current != null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, [agent.id]);

  // Stop polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current != null) window.clearTimeout(pollTimerRef.current);
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  function applyMeeting(m: Meeting) {
    setMessages(
      m.messages.map((msg, i) => ({
        id: `m-${i}-${msg.created_at}`,
        from: msg.role,
        text: msg.content,
        t: fmtTime(msg.created_at),
      })),
    );
    if (m.status === 'running') {
      setThinking(true);
      schedulePoll(m.id);
    } else {
      setThinking(false);
      if (m.status === 'failed' && m.error) setError(m.error);
    }
  }

  function schedulePoll(id: string) {
    if (pollTimerRef.current != null) window.clearTimeout(pollTimerRef.current);
    pollTimerRef.current = window.setTimeout(async () => {
      try {
        const m = await Workforce.getMeeting(id);
        applyMeeting(m);
      } catch (err) {
        setThinking(false);
        setError(err instanceof Error ? err.message : '폴링 실패');
      }
    }, 1500);
  }

  async function send() {
    const msg = input.trim();
    if (!msg || thinking) return;
    setError(null);
    const optimistic: DisplayMessage = {
      id: `u-${Date.now()}`,
      from: 'user',
      text: msg,
      t: fmtTime(Date.now()),
    };
    setMessages(m => [...m, optimistic]);
    setInput('');
    setThinking(true);

    try {
      if (!meetingId) {
        const r = await Workforce.startChat(agent.id, msg);
        setMeetingId(r.meeting_id);
        schedulePoll(r.meeting_id);
      } else {
        await Workforce.sendMessage(meetingId, agent.id, msg);
        schedulePoll(meetingId);
      }
    } catch (err) {
      setThinking(false);
      const message =
        err instanceof ApiError
          ? `${agent.role_ko} 호출 실패: ${err.message}`
          : err instanceof Error
            ? err.message
            : '알 수 없는 오류';
      setError(message);
    }
  }

  const team = teamById[agent.team];

  return (
    <aside
      role="dialog"
      aria-label={`${agent.role_ko} 1:1 채팅`}
      aria-modal="true"
      className="slide-in-right"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 460,
        zIndex: 180,
        background: 'var(--ink-1)',
        borderLeft: '1px solid var(--line-strong)',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Avatar
          initials={agent.initials}
          background={colorFor(agent)}
          size="lg"
          title={agent.role_ko}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StatusDot status={thinking ? 'thinking' : agent.status} />
            <span style={{ fontWeight: 900, fontSize: 15 }}>{agent.role_ko}</span>
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: team?.color,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {agent.role_en} · {team?.name_en} · live
          </div>
        </div>
        <button
          className="btn btn-ghost"
          onClick={onClose}
          style={{ padding: 10 }}
          aria-label="닫기"
          title="닫기 (Esc)"
        >
          <span style={{ fontFamily: 'var(--font-mono)' }} aria-hidden>✕</span>
        </button>
      </header>

      <div
        style={{
          padding: '8px 20px',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          gap: 6,
          fontSize: 11,
        }}
      >
        <Chip>{agent.model.replace('Claude ', '')}</Chip>
        {meetingId && <Chip>{meetingId.slice(0, 14)}</Chip>}
        <Chip>{thinking ? '응답 중…' : '대기'}</Chip>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        {messages.length === 0 && !thinking && <EmptyState agent={agent} />}
        {messages.map(m =>
          m.from === 'user' ? (
            <UserBubble key={m.id} text={m.text} t={m.t} />
          ) : (
            <AgentBubble key={m.id} agent={agent} text={m.text} t={m.t} />
          ),
        )}
        {thinking && <ThinkingBubble agent={agent} />}
        {error && (
          <div
            role="alert"
            style={{
              background: 'rgba(255,80,80,0.12)',
              border: '1px solid rgba(255,80,80,0.4)',
              color: '#ffb0b0',
              fontSize: 12,
              padding: '8px 12px',
              borderRadius: 8,
              marginTop: 8,
              fontFamily: 'var(--font-mono)',
            }}
          >
            ⚠ {error}
          </div>
        )}
      </div>

      <div
        style={{
          padding: 14,
          borderTop: '1px solid var(--line)',
          display: 'flex',
          gap: 8,
        }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={thinking}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={`${agent.role_ko}에게 메시지…`}
          aria-label="메시지 입력"
          style={{
            flex: 1,
            background: 'var(--ink-2)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-pill)',
            padding: '10px 16px',
            outline: 0,
            fontSize: 13,
            opacity: thinking ? 0.6 : 1,
          }}
        />
        <button
          className="btn btn-primary"
          onClick={send}
          disabled={thinking || !input.trim()}
          style={{ padding: '10px 14px' }}
          aria-label="전송"
        >
          →
        </button>
      </div>
    </aside>
  );
}

function EmptyState({ agent }: { agent: Agent }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--fg-soft)' }}>
      <div
        style={{
          fontSize: 32,
          marginBottom: 6,
          color: 'var(--fg-faint)',
          fontFamily: 'var(--font-mono)',
        }}
        aria-hidden
      >
        ▤
      </div>
      <div style={{ fontSize: 13, fontWeight: 700 }}>
        {agent.role_ko}와 대화 시작하기
      </div>
      <div
        style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          marginTop: 4,
          color: 'var(--fg-faint)',
        }}
      >
        실제 Anthropic API · 응답까지 5~20초 걸립니다
      </div>
    </div>
  );
}

function UserBubble({ text, t }: { text: string; t: string }) {
  return (
    <div
      className="fade-in"
      style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}
    >
      <div style={{ maxWidth: '85%' }}>
        <div
          style={{
            background: 'var(--mk-green)',
            color: '#07120a',
            borderRadius: '12px 12px 2px 12px',
            padding: '9px 13px',
            fontSize: 13,
            fontWeight: 700,
            whiteSpace: 'pre-wrap',
          }}
        >
          {text}
        </div>
        <div
          className="mono"
          style={{
            fontSize: 10,
            color: 'var(--fg-faint)',
            textAlign: 'right',
            marginTop: 3,
          }}
        >
          {t}
        </div>
      </div>
    </div>
  );
}

function AgentBubble({ agent, text, t }: { agent: Agent; text: string; t: string }) {
  return (
    <div className="fade-in" style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
      <Avatar initials={agent.initials} background={colorFor(agent)} size="sm" title={agent.role_ko} />
      <div style={{ maxWidth: '80%' }}>
        <div
          style={{
            background: 'var(--ink-3)',
            border: '1px solid var(--line)',
            borderRadius: '2px 12px 12px 12px',
            padding: '9px 13px',
            fontSize: 13,
            lineHeight: 1.55,
            whiteSpace: 'pre-wrap',
          }}
        >
          {text}
        </div>
        <div
          className="mono"
          style={{ fontSize: 10, color: 'var(--fg-faint)', marginTop: 3 }}
        >
          {t}
        </div>
      </div>
    </div>
  );
}

function ThinkingBubble({ agent }: { agent: Agent }) {
  return (
    <div className="fade-in" style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
      <Avatar initials={agent.initials} background={colorFor(agent)} size="sm" />
      <div
        style={{
          background: 'var(--ink-3)',
          border: '1px solid var(--line)',
          borderRadius: '2px 12px 12px 12px',
          padding: '9px 13px',
        }}
      >
        <span className="mono" style={{ fontSize: 11, color: 'var(--mk-green-glow)' }}>
          {agent.role_ko}이(가) 응답 중<span className="caret" style={{ height: '0.8em', width: '0.4em' }} />
        </span>
      </div>
    </div>
  );
}
