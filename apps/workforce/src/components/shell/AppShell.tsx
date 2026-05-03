import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface Props {
  current: string;
  onNav: (id: string) => void;
  onlineCount: number;
  totalCount: number;
  todayTokens?: string;
  liveMeetings?: number;
  notificationCount?: number;
  onNewMeeting?: () => void;
  children: ReactNode;
}

export function AppShell({
  current,
  onNav,
  onlineCount,
  totalCount,
  todayTokens,
  liveMeetings,
  notificationCount,
  onNewMeeting,
  children
}: Props) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        current={current}
        onNav={onNav}
        onlineCount={onlineCount}
        totalCount={totalCount}
        todayTokens={todayTokens}
        liveMeetings={liveMeetings}
      />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar onNewMeeting={onNewMeeting} notificationCount={notificationCount} />
        <main style={{ flex: 1, padding: 28 }}>{children}</main>
      </div>
    </div>
  );
}
