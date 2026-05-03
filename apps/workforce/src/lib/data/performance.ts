import type { PerformanceRecord } from '@/lib/types';

export const PERFORMANCE: Record<string, PerformanceRecord> = {
  ceo:    { score: 94, tasks: 184, fails: 2,  tokens: 412_000, cost: 89.20,  trend: '+4', strengths: ['전략 정렬', '의사결정 속도'], weaknesses: ['디테일 검토'],          status: 'stellar' },
  cfo:    { score: 91, tasks: 142, fails: 1,  tokens: 287_000, cost: 62.10,  trend: '+2', strengths: ['재무 모델링', '예측 정확도'], weaknesses: ['커뮤니케이션 톤'],       status: 'stellar' },
  cpo:    { score: 88, tasks: 167, fails: 4,  tokens: 511_000, cost: 110.30, trend: '+1', strengths: ['크로스팀 조율'],               weaknesses: ['회의 시간 관리'],        status: 'strong' },
  cto:    { score: 92, tasks: 211, fails: 3,  tokens: 624_000, cost: 134.80, trend: '0',  strengths: ['기술 의사결정'],               weaknesses: ['문서화 부족'],           status: 'stellar' },
  cmo:    { score: 85, tasks: 158, fails: 6,  tokens: 384_000, cost: 82.40,  trend: '+3', strengths: ['캠페인 기획'],                  weaknesses: ['ROI 측정'],              status: 'strong' },
  cro:    { score: 89, tasks: 198, fails: 4,  tokens: 312_000, cost: 67.20,  trend: '+5', strengths: ['거래 클로징'],                  weaknesses: ['파이프라인 위생'],       status: 'strong' },
  clo:    { score: 90, tasks: 87,  fails: 0,  tokens: 198_000, cost: 42.80,  trend: '+1', strengths: ['계약 정밀도'],                  weaknesses: ['속도'],                  status: 'strong' },
  'pm-1': { score: 82, tasks: 124, fails: 8,  tokens: 221_000, cost: 47.60,  trend: '-1', strengths: ['로드맵 명확성'],                weaknesses: ['스코프 크리프'],         status: 'ok' },
  'pm-2': { score: 78, tasks: 89,  fails: 5,  tokens: 156_000, cost: 33.40,  trend: '+2', strengths: ['리서치 합성'],                  weaknesses: ['출력 일관성'],           status: 'ok' },
  'eng-1':{ score: 87, tasks: 247, fails: 3,  tokens: 489_000, cost: 105.20, trend: '+2', strengths: ['백엔드 시스템'],                weaknesses: ['테스트 커버리지'],       status: 'strong' },
  'eng-2':{ score: 80, tasks: 178, fails: 7,  tokens: 312_000, cost: 67.20,  trend: '0',  strengths: ['UI 빠른 빌드'],                 weaknesses: ['접근성'],                status: 'ok' },
  'eng-3':{ score: 88, tasks: 142, fails: 2,  tokens: 178_000, cost: 38.40,  trend: '+1', strengths: ['인프라 자동화'],                weaknesses: ['비용 최적화'],           status: 'strong' },
  'eng-4':{ score: 64, tasks: 64,  fails: 18, tokens: 89_000,  cost: 19.20,  trend: '-6', strengths: [],                                weaknesses: ['테스트 신뢰성', '응답 시간'], status: 'at_risk' },
  'des-1':{ score: 86, tasks: 112, fails: 4,  tokens: 198_000, cost: 42.80,  trend: '+2', strengths: ['브랜드 일관성'],                weaknesses: ['마이크로카피'],          status: 'strong' },
  'des-2':{ score: 81, tasks: 98,  fails: 6,  tokens: 167_000, cost: 36.10,  trend: '+1', strengths: ['프로토타입 속도'],              weaknesses: ['엣지 케이스'],           status: 'ok' },
  'mkt-1':{ score: 79, tasks: 167, fails: 9,  tokens: 287_000, cost: 62.10,  trend: '+4', strengths: ['콘텐츠 양'],                    weaknesses: ['SEO 정합'],              status: 'ok' },
  'mkt-2':{ score: 84, tasks: 134, fails: 5,  tokens: 198_000, cost: 42.80,  trend: '+2', strengths: ['퍼포먼스 최적화'],              weaknesses: ['크리에이티브 다양성'],   status: 'strong' },
  'mkt-3':{ score: 70, tasks: 76,  fails: 11, tokens: 64_000,  cost: 13.80,  trend: '-3', strengths: ['키워드 분석'],                  weaknesses: ['콘텐츠 갭 발견'],        status: 'at_risk' },
  'sls-1':{ score: 86, tasks: 312, fails: 7,  tokens: 412_000, cost: 89.20,  trend: '+3', strengths: ['리드 자격검증'],                weaknesses: ['팔로우업 일정'],         status: 'strong' },
  'sls-2':{ score: 91, tasks: 178, fails: 2,  tokens: 287_000, cost: 62.10,  trend: '+4', strengths: ['거래 전략'],                    weaknesses: ['파이프 위생'],           status: 'stellar' },
  'fin-1':{ score: 87, tasks: 89,  fails: 1,  tokens: 142_000, cost: 30.70,  trend: '+1', strengths: ['예측 모델'],                    weaknesses: ['설명 가독성'],           status: 'strong' },
  'fin-2':{ score: 83, tasks: 124, fails: 3,  tokens: 167_000, cost: 36.10,  trend: '0',  strengths: ['분개·분류'],                    weaknesses: ['감가상각 미세조정'],     status: 'strong' },
  'lgl-1':{ score: 81, tasks: 67,  fails: 2,  tokens: 134_000, cost: 28.90,  trend: '+2', strengths: ['DPA 검토'],                     weaknesses: ['관할권 차이'],           status: 'ok' }
};
