import type { Approval } from '@/lib/types';

export const APPROVALS: Approval[] = [
  {
    id: 'ap-2941',
    title_ko: '환불 처리: cust_4F9X',
    title_en: 'Refund: cust_4F9X',
    requester: 'cfo',
    amount: 1200,
    currency: 'USD',
    type: '재무',
    risk: 'medium',
    requested: '방금',
    rationale_ko: '고객이 결제 후 14일 이내 미사용 환불 정책 적용 — 표준 환불.',
    rationale_en: 'Customer eligible under 14-day unused-refund policy.',
    impact_ko: '운영 현금에서 즉시 차감. 매출 -$1,200.',
    needs: ['CEO 또는 CFO + 1']
  },
  {
    id: 'ap-2940',
    title_ko: 'Q2 재활성화 캠페인 발송',
    title_en: 'Q2 Reactivation Campaign Send',
    requester: 'mkt-2',
    amount: 0,
    currency: '—',
    type: '마케팅',
    risk: 'medium',
    requested: '5분 전',
    rationale_ko: '12,400명 휴면 사용자 대상. 예상 전환 1.8% (≈ $42,800 ARR 회복).',
    rationale_en: '12,400 dormant users. Expected 1.8% conversion (≈$42.8K ARR recovery).',
    impact_ko: '도메인 평판 -2점 가능성. 발송 후 24시간 모니터링 필요.',
    needs: ['CMO 승인 (자동)', '법무 스팸 검토']
  },
  {
    id: 'ap-2939',
    title_ko: 'Acme MSA v3 서명 발송',
    title_en: 'Send Acme MSA v3 for signature',
    requester: 'lgl-1',
    amount: 48000,
    currency: 'USD',
    type: '법무·계약',
    risk: 'high',
    requested: '9분 전',
    rationale_ko: '엔터프라이즈 계약 — 책임 한도 표준 12개월 매출의 1.5x. 변경사항 2건 합의됨.',
    rationale_en: 'Enterprise contract — liability cap at 1.5× ARR. 2 redlines agreed.',
    impact_ko: '$48K ARR. 7일 내 클로징 목표.',
    needs: ['CLO 승인', 'CEO 또는 CFO 공동서명']
  },
  {
    id: 'ap-2942',
    title_ko: '신규 직원 채용: 그로스 분석가',
    title_en: 'New hire: Growth Analyst',
    requester: 'cmo',
    amount: 0,
    currency: 'tokens',
    type: 'HR · AI 채용',
    risk: 'medium',
    requested: '12분 전',
    rationale_ko: 'Claude Sonnet 4.5 기반. 월 800K 토큰 / $172 예상.',
    rationale_en: 'Claude Sonnet 4.5 based. ~800K tokens / $172/mo estimated.',
    impact_ko: '마케팅 팀 5명 → 6명. 분석 갭 해소.',
    needs: ['CEO 승인', 'CFO 예산 확인']
  }
];
