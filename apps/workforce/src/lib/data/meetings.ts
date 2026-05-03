import type { ActiveMeeting, MeetingScript } from '@/lib/types';

export const ACTIVE_MEETINGS: ActiveMeeting[] = [
  {
    id: 'm-1',
    topic_ko: 'Q2 마케팅 캠페인 킥오프',
    topic_en: 'Q2 Marketing Campaign Kickoff',
    started: '12분',
    participants: ['cmo', 'mkt-1', 'mkt-2', 'mkt-3', 'des-1', 'cro'],
    chair: 'cmo'
  },
  {
    id: 'm-2',
    topic_ko: '결제 시스템 사고 원인분석',
    topic_en: 'Payment Outage Postmortem',
    started: '4분',
    participants: ['cto', 'eng-1', 'eng-2', 'eng-3', 'eng-4'],
    chair: 'cto'
  }
];

/**
 * Scripted meeting transcript — UI plays via setTimeout(line.ms).
 * `default` is fallback when no topic-specific script exists.
 */
export const MEETING_SCRIPTS: Record<string, MeetingScript> = {
  default: [
    { from: 'ceo', ms: 600,   text_ko: '오늘 모인 이유는 분명해. 우리 다음 분기 우선순위를 못박아야 해.', text_en: "Reason we're here is clear — we lock next quarter's priorities today." },
    { from: 'cmo', ms: 1800,  text_ko: '마케팅 쪽은 콘텐츠 엔진을 자동화로 돌리면 인당 생산성 3배까지 올라갑니다.', text_en: "Marketing's bet: automate the content engine → 3× output per head." },
    { from: 'cto', ms: 3600,  text_ko: '기술적으로는 가능. 다만 모델 비용을 미리 시뮬레이션 해야 함.', text_en: 'Tech-wise feasible. We need to simulate model costs first though.' },
    { from: 'cfo', ms: 5400,  text_ko: '지금 번레이트로 가면 14개월 런웨이. 6개월 안에 매출 2배 못 만들면 위험.', text_en: "At current burn we have 14mo runway. If revenue doesn't 2× in 6mo, we're exposed." },
    { from: 'cro', ms: 7600,  text_ko: '엔터프라이즈 파이프라인 1.8M 잡혀 있어요. 클로징은 7주 안에.', text_en: 'Enterprise pipe sits at $1.8M. Closes within 7 weeks.' },
    { from: 'cpo', ms: 9800,  text_ko: '정리합니다 — 마케팅 자동화 + 엔터프라이즈 클로징 + 비용 시뮬레이션. 다음 단계는?', text_en: 'Summarizing — marketing automation, enterprise closes, cost sim. Next steps?' },
    { from: 'ceo', ms: 12000, text_ko: '좋아요. CTO는 내일까지 비용 모델, CMO는 자동화 PoC, CRO는 이번 주 클로징 예정 명단.', text_en: 'Good. CTO: cost model by tomorrow. CMO: automation PoC. CRO: list of closes this week.' }
  ]
};
