import { useEffect, useState } from 'react';

interface Props {
  onNewMeeting?: () => void;
  notificationCount?: number;
}

export function TopBar({ onNewMeeting, notificationCount = 0 }: Props) {
  const time = useLiveClock();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '16px 28px',
        height: 'var(--topbar-h)',
        borderBottom: '1px solid var(--line)',
        background: 'rgba(7,9,10,0.7)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      {/* LIVE indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
        <span
          className="mono"
          style={{ fontSize: 11.5, color: 'var(--mk-green-glow)', letterSpacing: '0.12em' }}
        >
          ▶ 실시간 / LIVE
        </span>
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-soft)' }}>· {time}</span>
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-faint)' }}>· UTC+09</span>
      </div>

      {/* Search */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          background: 'var(--ink-2)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--r-pill)',
          width: 320
        }}
      >
        <span
          className="mono"
          style={{ color: 'var(--fg-soft)', fontSize: 13 }}
          aria-hidden
        >
          ⌕
        </span>
        <input
          placeholder="직원, 작업, 회의 검색…"
          aria-label="검색 / Search"
          style={{
            flex: 1,
            background: 'transparent',
            border: 0,
            outline: 0,
            color: 'var(--fg)',
            fontSize: 13
          }}
        />
        <span className="kbd">⌘K</span>
      </label>

      <button className="btn btn-ghost" title="알림 / Notifications" aria-label="알림">
        <span className="mono" aria-hidden>◔</span>
        <span style={{ fontSize: 11 }}>알림</span>
        {notificationCount > 0 && (
          <span className="chip green" style={{ padding: '1px 7px', fontSize: 10 }}>
            {notificationCount}
          </span>
        )}
      </button>

      <button className="btn btn-primary" onClick={onNewMeeting}>
        <span style={{ fontFamily: 'var(--font-mono)' }} aria-hidden>⊕</span>
        회의 소집 / New Meeting
      </button>
    </div>
  );
}

function useLiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now.toLocaleTimeString('ko-KR', { hour12: false });
}
