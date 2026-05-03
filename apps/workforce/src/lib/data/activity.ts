import type { ActivityEntry } from '@/lib/types';

/**
 * Activity feed — oldest first. UI reverses for display ("most recent on top").
 */
export const ACTIVITY: ActivityEntry[] = [
  { t: '방금',    agent: 'sls-1', verb_ko: '리드 12건 자격검증 완료',  verb_en: 'qualified 12 leads',                tag: 'sales',       icon: '▶' },
  { t: '1분 전',  agent: 'eng-1', verb_ko: 'PR #482 머지',              verb_en: 'merged PR #482',                    tag: 'engineering', icon: '⬢' },
  { t: '3분 전',  agent: 'mkt-1', verb_ko: '블로그 초안 3편 작성',      verb_en: 'drafted 3 blog posts',              tag: 'marketing',   icon: '✺' },
  { t: '5분 전',  agent: 'cfo',   verb_ko: 'Q2 번레이트 보고서 게시',   verb_en: 'posted Q2 burn-rate report',        tag: 'finance',     icon: '$' },
  { t: '8분 전',  agent: 'des-2', verb_ko: '온보딩 v3 시안 업로드',     verb_en: 'uploaded onboarding v3 mockups',    tag: 'design',      icon: '✦' },
  { t: '12분 전', agent: 'lgl-1', verb_ko: 'DPA 검토 — 변경 요청 2건',  verb_en: 'reviewed DPA — 2 changes requested', tag: 'legal',      icon: '§' },
  { t: '15분 전', agent: 'pm-2',  verb_ko: '사용자 인터뷰 8건 합성',    verb_en: 'synthesized 8 user interviews',     tag: 'product',     icon: '▲' },
  { t: '22분 전', agent: 'ceo',   verb_ko: '올핸즈 안건 승인',          verb_en: 'approved all-hands agenda',         tag: 'exec',        icon: '◆' },
  { t: '31분 전', agent: 'eng-2', verb_ko: '결제 플로우 리팩토링',      verb_en: 'refactored checkout flow',          tag: 'engineering', icon: '⬢' },
  { t: '47분 전', agent: 'mkt-2', verb_ko: 'Meta 캠페인 입찰 +18%',     verb_en: 'raised Meta campaign bid +18%',     tag: 'marketing',   icon: '✺' },
  { t: '1시간 전', agent: 'fin-1', verb_ko: '현금흐름 예측 갱신',       verb_en: 'updated cash-flow forecast',        tag: 'finance',     icon: '$' },
  { t: '1시간 전', agent: 'cro',   verb_ko: '대형 거래 1건 클로징',     verb_en: 'closed 1 enterprise deal',          tag: 'sales',       icon: '▶' }
];
