'use strict';

const SPEC_META = {
  'customer-journey-audit.spec.js': {
    severity: 'High',
    why: '고객이 메인 사이트에 들어와 보는 콘솔/HTTP 에러는 UX와 매출에 직접 영향',
    ifNotFixed: '실 고객 화면에서 깨진 동작/주문 실패가 발생할 수 있음',
  },
  'customer-deep-audit.spec.js': {
    severity: 'High',
    why: '메뉴 → 장바구니 → 결제 흐름이 깨지면 매출 자체가 차단',
    ifNotFixed: '주문 완주 불가 → 매출 손실',
  },
  'qa-manual-inspection.spec.js': {
    severity: 'Medium',
    why: '페이지 로드/i18n/RTL 같은 기본 점검 실패',
    ifNotFixed: '아랍어 사용자/이미지 로딩 실패로 즉시 이탈',
  },
  '15-mobile-375-qa.spec.js': {
    severity: 'High',
    why: '이라크 고객 다수가 모바일(375px 이하)에서 접속',
    ifNotFixed: '모바일 사용자가 주문 화면을 정상 사용 못함',
  },
  '16-inventory-sync.spec.js': {
    severity: 'High',
    why: '재고 차감/복구 동기화 실패는 운영 차질로 직결',
    ifNotFixed: '재고 음수/부정확, 발주 오판, 재료 소진 미감지',
  },
  '17-menu-search-cart.spec.js': {
    severity: 'Medium',
    why: '메뉴 검색·장바구니 drawer 흐름이 막히면 주문 진입 차단',
    ifNotFixed: '고객이 원하는 메뉴를 찾지 못해 이탈',
  },
  '18-order-id-randomness.spec.js': {
    severity: 'Critical',
    why: '주문 ID 엔트로피 부족은 다른 고객 주문 ID 추측 공격에 노출',
    ifNotFixed: '공격자가 /api/orders/:id 무단 조회 → 개인정보·금액 유출',
  },
  '19-order-by-id-auth.spec.js': {
    severity: 'Critical',
    why: '주문 조회 권한 검사 실패는 인증 우회로 이어짐',
    ifNotFixed: '비인증/타인 계정이 본인 외 주문 전체 데이터 열람 가능',
  },
  '20-status-race-stamp.spec.js': {
    severity: 'High',
    why: '동시 상태 전이 시 멱등성 위반은 데이터 정합성 손상',
    ifNotFixed: '스탬프 중복 적립, 주문 상태 꼬임, 정산 오류',
  },
  '21-refund-overflow.spec.js': {
    severity: 'Critical',
    why: '환불 누적이 주문 수량을 초과 가능하면 매출 손실 직결',
    ifNotFixed: '같은 주문을 여러 번 환불받는 사기·수치 음수화',
  },
};

const DEFAULT_META = {
  severity: 'Medium',
  why: '자동 회귀 테스트 실패는 잠재적 운영 이슈를 시사',
  ifNotFixed: '관련 기능이 비정상 동작 가능 — 수동 확인 필요',
};

function metaFor(specFile) {
  return SPEC_META[specFile] || DEFAULT_META;
}

const QA_SPECS = [
  'customer-journey-audit.spec.js',
  'customer-deep-audit.spec.js',
  'qa-manual-inspection.spec.js',
  '15-mobile-375-qa.spec.js',
  '16-inventory-sync.spec.js',
  '17-menu-search-cart.spec.js',
  '18-order-id-randomness.spec.js',
  '19-order-by-id-auth.spec.js',
  '20-status-race-stamp.spec.js',
  '21-refund-overflow.spec.js',
];

module.exports = { SPEC_META, DEFAULT_META, metaFor, QA_SPECS };
