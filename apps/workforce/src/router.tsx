import { Navigate, Outlet, RouterProvider, createBrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/shell';
import { ChatPanel, ChatProvider } from '@/components/chat';
import { AuthGuard, AuthProvider } from '@/components/auth';
import {
  ApprovalsView,
  AuditView,
  BudgetView,
  DirectoryView,
  HomeView,
  HrView,
  IntegrationsView,
  KnowledgeView,
  LogsView,
  MeetingsView,
  OrgView,
  TasksView
} from '@/views';
import { useKpis } from '@/lib/useLiveData';

/**
 * Maps nav-item id (sidebar) ⇄ URL path. Same string for both — keeps the
 * sidebar's `current` state and `onNav` handler trivially consistent.
 */
const ROUTES: Array<{ id: string; path: string; element: JSX.Element }> = [
  { id: 'home',         path: 'home',         element: <HomeView /> },
  { id: 'directory',    path: 'directory',    element: <DirectoryView /> },
  { id: 'meetings',     path: 'meetings',     element: <MeetingsView /> },
  { id: 'org',          path: 'org',          element: <OrgView /> },
  { id: 'tasks',        path: 'tasks',        element: <TasksView /> },
  { id: 'approvals',    path: 'approvals',    element: <ApprovalsView /> },
  { id: 'knowledge',    path: 'knowledge',    element: <KnowledgeView /> },
  { id: 'integrations', path: 'integrations', element: <IntegrationsView /> },
  { id: 'hr',           path: 'hr',           element: <HrView /> },
  { id: 'budget',       path: 'budget',       element: <BudgetView /> },
  { id: 'audit',        path: 'audit',        element: <AuditView /> },
  { id: 'logs',         path: 'logs',         element: <LogsView /> }
];

function fmtTokens(replies: number): string {
  // Rough token estimate: 600 input + 400 output per agent reply.
  // Mostly to give the user a sense of activity, not a billing-grade number.
  const tokens = replies * 1000;
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return String(tokens);
}

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: kpis } = useKpis();

  const segment = location.pathname.split('/').filter(Boolean)[0] ?? 'home';
  const current = ROUTES.find(r => r.path === segment)?.id ?? 'home';

  return (
    <ChatProvider>
      <AppShell
        current={current}
        onNav={id => navigate(`/${id}`)}
        onlineCount={kpis?.total_agents ?? 0}
        totalCount={kpis?.total_agents ?? 24}
        todayTokens={kpis ? fmtTokens(kpis.agent_replies_24h) : '—'}
        liveMeetings={kpis?.live_meetings ?? 0}
        notificationCount={kpis?.approvals_pending ?? 0}
        onNewMeeting={() => navigate('/meetings')}
      >
        <Outlet />
      </AppShell>
      <ChatPanel />
    </ChatProvider>
  );
}

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <Navigate to="/home" replace /> },
        ...ROUTES.map(r => ({ path: r.path, element: r.element })),
        { path: '*', element: <Navigate to="/home" replace /> }
      ]
    }
  ],
  { basename: '/workforce' }
);

export function AppRouter() {
  return (
    <AuthProvider>
      <AuthGuard>
        <RouterProvider router={router} />
      </AuthGuard>
    </AuthProvider>
  );
}
