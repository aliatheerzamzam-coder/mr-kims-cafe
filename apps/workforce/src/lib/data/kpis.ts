import type { Kpi } from '@/lib/types';

export const KPIS: Kpi[] = [
  { label_ko: '활성 직원',   label_en: 'Active Agents', value: '21 / 24', sub_ko: '현재 온라인',  sub_en: 'now online',   trend: '+2'   },
  { label_ko: '완료 작업',   label_en: 'Tasks Shipped', value: '847',     sub_ko: '지난 24시간',  sub_en: 'last 24h',     trend: '+12%' },
  { label_ko: '토큰 사용량', label_en: 'Tokens Used',   value: '4.2M',    sub_ko: '오늘',         sub_en: 'today',        trend: '67%'  },
  { label_ko: '진행 회의',   label_en: 'Live Meetings', value: '2',       sub_ko: '원탁 회의실',  sub_en: 'round table',  trend: '—'    }
];
