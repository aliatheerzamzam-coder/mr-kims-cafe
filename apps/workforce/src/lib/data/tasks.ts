import type { Task } from '@/lib/types';

/**
 * Mock task board — 4 columns. README spec; not present in original data.jsx.
 * Distribute across all teams to make the kanban look realistic.
 */
export const TASKS: Task[] = [
  // Backlog
  { id: 't-101', title_ko: '결제 페이지 A/B 테스트 설계',     title_en: 'Design checkout A/B test',          status: 'backlog',     assignee: 'pm-1',  due: '내일',     priority: 'medium' },
  { id: 't-102', title_ko: '디자인 시스템 v2 폰트 변경',       title_en: 'Update DS v2 typography',           status: 'backlog',     assignee: 'des-1', due: '3일',      priority: 'low' },
  { id: 't-103', title_ko: '신규 ICP 정의 워크숍 준비',         title_en: 'Prep new-ICP workshop',             status: 'backlog',     assignee: 'cro',   due: '5일',      priority: 'medium' },
  { id: 't-104', title_ko: 'GDPR 변경사항 검토',                title_en: 'Review GDPR amendments',            status: 'backlog',     assignee: 'lgl-1', due: '7일',      priority: 'high' },

  // In progress
  { id: 't-201', title_ko: '결제 시스템 사고 RCA 작성',         title_en: 'Write payment outage RCA',          status: 'in_progress', assignee: 'cto',   due: '오늘',     priority: 'critical' },
  { id: 't-202', title_ko: 'Q2 캠페인 크리에이티브 3종 제작',   title_en: 'Build 3 Q2 campaign creatives',     status: 'in_progress', assignee: 'mkt-1', due: '오늘',     priority: 'high' },
  { id: 't-203', title_ko: '엔터프라이즈 데모 환경 셋업',       title_en: 'Stand up enterprise demo env',      status: 'in_progress', assignee: 'eng-3', due: '내일',     priority: 'high' },
  { id: 't-204', title_ko: '4월 번레이트 보고 작성',            title_en: 'Draft April burn-rate report',      status: 'in_progress', assignee: 'fin-1', due: '내일',     priority: 'medium' },

  // Review
  { id: 't-301', title_ko: 'PR #482 코드 리뷰',                  title_en: 'Code review PR #482',               status: 'review',      assignee: 'eng-1', due: '오늘',     priority: 'medium' },
  { id: 't-302', title_ko: '온보딩 v3 시안 — 디자인 리뷰',      title_en: 'Onboarding v3 — design review',     status: 'review',      assignee: 'des-1', due: '오늘',     priority: 'medium' },
  { id: 't-303', title_ko: 'Acme MSA 변경사항 검토',            title_en: 'Review Acme MSA redlines',          status: 'review',      assignee: 'clo',   due: '내일',     priority: 'high' },

  // Done
  { id: 't-401', title_ko: '리드 12건 자격검증',                 title_en: 'Qualified 12 leads',                status: 'done',        assignee: 'sls-1', due: '오늘',     priority: 'medium' },
  { id: 't-402', title_ko: 'PR #481 머지 — 결제 리팩터',        title_en: 'Merged PR #481 — checkout refactor', status: 'done',        assignee: 'eng-2', due: '오늘',     priority: 'high' },
  { id: 't-403', title_ko: '블로그 초안 3편 게시',               title_en: 'Published 3 blog drafts',           status: 'done',        assignee: 'mkt-1', due: '오늘',     priority: 'low' },
  { id: 't-404', title_ko: 'DPA 검토 완료',                      title_en: 'DPA review done',                   status: 'done',        assignee: 'lgl-1', due: '어제',     priority: 'medium' }
];
