import type { KnowledgeDoc } from '@/lib/types';

export const KNOWLEDGE_DOCS: KnowledgeDoc[] = [
  { id: 'k-1',  type: '전략',   title_ko: '회사 미션 & 비전 v2',           title_en: 'Company Mission & Vision v2',         owner: 'ceo',   updated: '2일 전',  size: '4.2KB', access: 'all',                 pinned: true },
  { id: 'k-2',  type: '전략',   title_ko: '2026 OKR',                       title_en: '2026 OKRs',                          owner: 'cpo',   updated: '1일 전',  size: '12KB',  access: 'all',                 pinned: true },
  { id: 'k-3',  type: '운영',   title_ko: '온콜 절차 / 인시던트 대응',     title_en: 'On-call & Incident Response',        owner: 'cto',   updated: '5일 전',  size: '18KB',  access: 'engineering' },
  { id: 'k-4',  type: '운영',   title_ko: '코드 리뷰 가이드라인',          title_en: 'Code Review Guidelines',             owner: 'cto',   updated: '11일 전', size: '8KB',   access: 'engineering' },
  { id: 'k-5',  type: '브랜드', title_ko: '브랜드 보이스 & 톤',             title_en: 'Brand Voice & Tone',                 owner: 'cmo',   updated: '3일 전',  size: '6KB',   access: 'all',                 pinned: true },
  { id: 'k-6',  type: '브랜드', title_ko: '디자인 시스템 — 타이포 / 컬러', title_en: 'Design System — Type / Color',       owner: 'des-1', updated: '7일 전',  size: '22KB',  access: 'design' },
  { id: 'k-7',  type: '법무',   title_ko: '표준 NDA 템플릿',                title_en: 'Standard NDA Template',              owner: 'clo',   updated: '30일 전', size: '9KB',   access: 'all' },
  { id: 'k-8',  type: '법무',   title_ko: 'DPA — GDPR / CCPA 정렬',        title_en: 'DPA — GDPR / CCPA aligned',          owner: 'clo',   updated: '14일 전', size: '31KB',  access: 'all' },
  { id: 'k-9',  type: '재무',   title_ko: '재무 정책 / 지출 권한',          title_en: 'Financial Policy / Spend Authority', owner: 'cfo',   updated: '9일 전',  size: '7KB',   access: 'all',                 pinned: true },
  { id: 'k-10', type: '영업',   title_ko: 'ICP / 페르소나 정의',            title_en: 'ICP / Persona Definitions',          owner: 'cro',   updated: '4일 전',  size: '11KB',  access: 'sales,marketing' },
  { id: 'k-11', type: '영업',   title_ko: '디스커버리 콜 플레이북',         title_en: 'Discovery Call Playbook',            owner: 'sls-2', updated: '6일 전',  size: '14KB',  access: 'sales' },
  { id: 'k-12', type: '회의록', title_ko: '주간 경영진 — 04/28',           title_en: 'Weekly Exec — Apr 28',               owner: 'cpo',   updated: '어제',     size: '5KB',   access: 'exec' },
  { id: 'k-13', type: '회의록', title_ko: '결제 사고 포스트모템',           title_en: 'Payment Outage Postmortem',          owner: 'cto',   updated: '오늘',     size: '13KB',  access: 'engineering,exec' },
  { id: 'k-14', type: '리서치', title_ko: '사용자 인터뷰 합성 — 4월',      title_en: 'User Interview Synthesis — Apr',     owner: 'pm-2',  updated: '2일 전',  size: '26KB',  access: 'product,design' }
];
