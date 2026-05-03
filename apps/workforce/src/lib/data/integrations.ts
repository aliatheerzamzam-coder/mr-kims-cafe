import type { Integration } from '@/lib/types';

export const INTEGRATIONS: Integration[] = [
  { id: 'slack',      name: 'Slack',        cat: '커뮤니케이션', glyph: '#', color: '#4a154b', status: 'connected',    ko: '팀 채널 동기화',    en: 'team channel sync',       events: 1284, last: '2분 전',   scopes: ['채널 읽기', '메시지 발송', 'DM'] },
  { id: 'gmail',      name: 'Gmail',        cat: '커뮤니케이션', glyph: '✉', color: '#ea4335', status: 'connected',    ko: '메일 송수신',       en: 'email send & receive',    events: 412,  last: '5분 전',   scopes: ['받은편지함 읽기', '초안 생성', '발송'] },
  { id: 'github',     name: 'GitHub',       cat: '개발',         glyph: '◐', color: '#24292f', status: 'connected',    ko: 'PR / 이슈 / 배포',  en: 'PR / issue / deploy',     events: 86,   last: '1분 전',   scopes: ['레포 읽기', 'PR 생성', '이슈 코멘트'] },
  { id: 'linear',     name: 'Linear',       cat: '개발',         glyph: '◰', color: '#5e6ad2', status: 'connected',    ko: '이슈 트래킹',       en: 'issue tracking',          events: 158,  last: '12분 전',  scopes: ['이슈 읽기', '이슈 생성', '상태 변경'] },
  { id: 'stripe',     name: 'Stripe',       cat: '재무',         glyph: '$', color: '#635bff', status: 'connected',    ko: '결제·구독',         en: 'payments & subscriptions', events: 47,  last: '방금',     scopes: ['결제 읽기', '환불 (승인필요)', '고객 조회'] },
  { id: 'qbo',        name: 'QuickBooks',   cat: '재무',         glyph: '₩', color: '#2ca01c', status: 'connected',    ko: '회계 장부',         en: 'books & ledger',          events: 22,   last: '1시간 전', scopes: ['거래 읽기', '송장 생성'] },
  { id: 'salesforce', name: 'Salesforce',   cat: '영업',         glyph: '☁', color: '#00a1e0', status: 'connected',    ko: 'CRM 파이프라인',    en: 'CRM pipeline',            events: 234,  last: '8분 전',   scopes: ['리드 읽기/쓰기', '기회 업데이트'] },
  { id: 'hubspot',    name: 'HubSpot',      cat: '마케팅',       glyph: '◓', color: '#ff7a59', status: 'connected',    ko: '마케팅 자동화',     en: 'marketing automation',    events: 401,  last: '3분 전',   scopes: ['연락처 읽기', '캠페인 발송'] },
  { id: 'notion',     name: 'Notion',       cat: '지식',         glyph: '▦', color: '#000000', status: 'connected',    ko: '문서·위키',         en: 'docs & wiki',             events: 312,  last: '9분 전',   scopes: ['페이지 읽기/쓰기'] },
  { id: 'drive',      name: 'Google Drive', cat: '지식',         glyph: '△', color: '#1fa463', status: 'connected',    ko: '파일 저장소',       en: 'file storage',            events: 189,  last: '15분 전',  scopes: ['파일 읽기', '파일 생성'] },
  { id: 'figma',      name: 'Figma',        cat: '디자인',       glyph: '◆', color: '#f24e1e', status: 'connected',    ko: '디자인 파일',       en: 'design files',            events: 64,   last: '27분 전',  scopes: ['파일 읽기', '코멘트'] },
  { id: 'zoom',       name: 'Zoom',         cat: '커뮤니케이션', glyph: '▶', color: '#2d8cff', status: 'needs_auth',   ko: '외부 회의',         en: 'external meetings',       events: 0,    last: '—',        scopes: [] },
  { id: 'docusign',   name: 'DocuSign',     cat: '법무',         glyph: '§', color: '#ffb600', status: 'connected',    ko: '전자 서명',         en: 'e-signature',             events: 18,   last: '2시간 전', scopes: ['봉투 발송 (승인필요)', '서명 추적'] },
  { id: 'intercom',   name: 'Intercom',     cat: '고객',         glyph: '◔', color: '#1f8ded', status: 'error',        ko: '고객 지원',         en: 'customer support',        events: 0,    last: '오류',     scopes: ['메시지 읽기/쓰기'] },
  { id: 'x',          name: 'X / Twitter',  cat: '마케팅',       glyph: '✕', color: '#1da1f2', status: 'disconnected', ko: '소셜 발행',         en: 'social publishing',       events: 0,    last: '—',        scopes: [] },
  { id: 'datadog',    name: 'Datadog',      cat: '개발',         glyph: '◉', color: '#632ca6', status: 'connected',    ko: '모니터링·알림',     en: 'monitoring & alerts',     events: 73,   last: '방금',     scopes: ['메트릭 읽기', '알림 수신'] }
];
