import { Fragment } from 'react';
import { NAV_ITEMS, GROUP_LABELS } from './nav-items';
import { useAuth } from '@/components/auth';
import type { NavGroup, NavItem } from '@/lib/types';

interface Props {
  current: string;
  onNav: (id: string) => void;
  onlineCount: number;
  totalCount: number;
  todayTokens?: string;     // pre-formatted, e.g. "4.2M"
  liveMeetings?: number;
  founderName?: string;
  founderEmail?: string;
}

const GROUP_ORDER: NavGroup[] = ['main', 'ops', 'admin'];

export function Sidebar({
  current,
  onNav,
  onlineCount,
  totalCount,
  todayTokens = '0',
  liveMeetings = 0,
  founderName = '창업자',
  founderEmail = 'founder@workforce'
}: Props) {
  const groups = GROUP_ORDER.map(g => ({
    group: g,
    items: NAV_ITEMS.filter(it => it.group === g)
  }));

  return (
    <aside
      style={{
        width: 'var(--sidebar-w)',
        flex: 'none',
        background: 'var(--ink-0)',
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 14px',
        gap: 4,
        height: '100vh',
        position: 'sticky',
        top: 0
      }}
    >
      {/* Logo */}
      <div style={{ padding: '8px 10px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'var(--mk-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontWeight: 900,
            color: 'var(--ink-0)',
            fontSize: 15,
            boxShadow: '0 4px 12px rgba(54,125,77,0.4)'
          }}
        >
          ▣
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{ fontWeight: 900, fontSize: 14, letterSpacing: '-0.005em' }}>
            오피스 / Office
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9.5,
              letterSpacing: '0.18em',
              color: 'var(--fg-soft)',
              textTransform: 'uppercase',
              marginTop: 2
            }}
          >
            ai workforce os
          </span>
        </div>
      </div>

      {/* Nav groups */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }} aria-label="Primary">
        {groups.map(({ group, items }) => (
          <Fragment key={group}>
            <div
              className="eyebrow eyebrow-mid"
              style={{ padding: '10px 10px 4px', color: 'var(--fg-faint)' }}
            >
              {GROUP_LABELS[group].ko}{' '}
              <span style={{ color: 'var(--fg-faint)' }}>/</span> {GROUP_LABELS[group].en}
            </div>
            {items.map(it => (
              <NavButton key={it.id} item={it} active={current === it.id} onNav={onNav} />
            ))}
          </Fragment>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {/* System status */}
      <div className="card" style={{ padding: 14, background: 'var(--ink-2)' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>· 시스템 상태</div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--fg-mid)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}
        >
          <Stat label="직원" value={`${onlineCount} / ${totalCount}`} accent />
          <Stat label="진행 회의" value={`${liveMeetings}`} />
          <Stat label="오늘 토큰" value={todayTokens} />
        </div>
      </div>

      {/* Founder identity + logout */}
      <FounderTile name={founderName} email={founderEmail} />
    </aside>
  );
}

function FounderTile({ name, email }: { name: string; email: string }) {
  const { logout } = useAuth();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 6px',
        marginTop: 6
      }}
    >
      <div
        className="avatar sm"
        style={{ background: 'linear-gradient(135deg, #fbbf24, #f472b6)' }}
        aria-hidden
      >
        나
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 800 }}>{name} / Founder</div>
        <div
          style={{
            fontSize: 10.5,
            color: 'var(--fg-soft)',
            fontFamily: 'var(--font-mono)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {email}
        </div>
      </div>
      <button
        onClick={() => {
          void logout();
        }}
        title="로그아웃 / Sign out"
        aria-label="로그아웃"
        style={{
          border: '1px solid var(--line)',
          background: 'var(--ink-2)',
          color: 'var(--fg-mid)',
          width: 28,
          height: 28,
          borderRadius: 8,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          transition: 'all var(--speed) var(--ease)'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = 'var(--st-danger)';
          e.currentTarget.style.borderColor = 'rgba(244,113,113,0.4)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = 'var(--fg-mid)';
          e.currentTarget.style.borderColor = 'var(--line)';
        }}
      >
        ⏻
      </button>
    </div>
  );
}

function NavButton({
  item,
  active,
  onNav
}: {
  item: NavItem;
  active: boolean;
  onNav: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onNav(item.id)}
      aria-current={active ? 'page' : undefined}
      className="btn"
      style={{
        justifyContent: 'flex-start',
        background: active ? 'var(--ink-3)' : 'transparent',
        border: active ? '1px solid var(--line-strong)' : '1px solid transparent',
        color: active ? 'var(--fg)' : 'var(--fg-mid)',
        padding: '9px 12px',
        borderRadius: 10,
        fontWeight: active ? 800 : 600,
        fontSize: 13,
        transform: 'none',
        boxShadow: 'none'
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          width: 18,
          textAlign: 'center',
          color: active ? 'var(--mk-green-glow)' : 'var(--fg-soft)'
        }}
        aria-hidden
      >
        {item.icon}
      </span>
      <span>{item.ko}</span>
      {item.badge ? (
        <span
          className="chip green"
          style={{ marginLeft: 'auto', padding: '1px 7px', fontSize: 10 }}
          aria-label={`${item.badge} pending`}
        >
          {item.badge}
        </span>
      ) : (
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--fg-faint)',
            letterSpacing: '0.05em'
          }}
        >
          {item.en}
        </span>
      )}
    </button>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span>{label}</span>
      <span className="mono" style={{ color: accent ? 'var(--mk-green-glow)' : 'var(--fg-mid)' }}>
        {value}
      </span>
    </div>
  );
}
