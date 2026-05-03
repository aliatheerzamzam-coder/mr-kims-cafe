import type { NavItem } from '@/lib/types';

/**
 * Sidebar nav definition. Order matters — rendered top-to-bottom,
 * grouped by `group` field. Step 5 wires `id` to react-router routes.
 */
export const NAV_ITEMS: NavItem[] = [
  { id: 'home',         ko: '홈',     en: 'Home',         icon: '◐', group: 'main' },
  { id: 'directory',    ko: '직원',   en: 'Agents',       icon: '▦', group: 'main' },
  { id: 'meetings',     ko: '회의실', en: 'Round Table',  icon: '◯', group: 'main' },
  { id: 'org',          ko: '조직도', en: 'Org Chart',    icon: '⊞', group: 'main' },
  { id: 'tasks',        ko: '작업',   en: 'Tasks',        icon: '✓', group: 'main' },
  { id: 'approvals',    ko: '결재',   en: 'Approvals',    icon: '⊠', group: 'ops', badge: 4 },
  { id: 'knowledge',    ko: '지식',   en: 'Knowledge',    icon: '▣', group: 'ops' },
  { id: 'integrations', ko: '연동',   en: 'Integrations', icon: '⌥', group: 'ops' },
  { id: 'hr',           ko: '인사',   en: 'HR',           icon: '⌬', group: 'admin' },
  { id: 'budget',       ko: '예산',   en: 'Budget',       icon: '$', group: 'admin' },
  { id: 'audit',        ko: '감사',   en: 'Audit',        icon: '▤', group: 'admin' },
  { id: 'logs',         ko: '로그',   en: 'Logs',         icon: '≣', group: 'admin' }
];

export const GROUP_LABELS: Record<NavItem['group'], { ko: string; en: string }> = {
  main:  { ko: '워크스페이스', en: 'Workspace' },
  ops:   { ko: '운영',         en: 'Ops' },
  admin: { ko: '관리',         en: 'Admin' }
};
