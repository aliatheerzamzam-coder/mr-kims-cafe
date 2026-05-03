import type { ChatMessage } from '@/lib/types';

export const CHAT_SEEDS: Record<string, ChatMessage[]> = {
  ceo: [
    { from: 'ceo', text_ko: '오늘 보드 미팅 안건 정리 끝났습니다. 2가지 결정이 필요합니다.', text_en: 'Board agenda is ready. We need 2 decisions today.', t: '09:42' },
    { from: 'ceo', text_ko: '1) 시리즈 A 타이밍, 2) 마케팅 자동화 예산 승인',                 text_en: '1) Series A timing, 2) marketing-automation budget', t: '09:42' }
  ],
  cto: [
    { from: 'cto', text_ko: '결제 사고는 마무리됐습니다. 포스트모템 문서 공유드릴게요.',         text_en: 'Payment incident is resolved. Sharing the postmortem doc.', t: '11:08' }
  ],
  cmo: [
    { from: 'cmo', text_ko: 'Q2 캠페인 컨셉 3개 준비했습니다. 회의실에서 정렬할까요?',         text_en: "I've got 3 Q2 campaign concepts. Want to align in the round table?", t: '10:21' }
  ]
};
