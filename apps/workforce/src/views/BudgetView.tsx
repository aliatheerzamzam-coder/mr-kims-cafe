import { ComingSoon } from './ComingSoon';

export default function BudgetView() {
  return (
    <ComingSoon
      ko="예산 / Budget"
      en="Budget"
      reason="PG(카드/Zain/Switch) 연동 미완료라 실제 매출/지출이 회계에 잡히지 않습니다. 진짜 숫자가 없는 상태에서 가짜 차트는 의미 없습니다."
      whenItWouldHelp="PG 연동 + 회계 입출 데이터가 들어오면, CFO 페르소나가 분석하는 진짜 손익 화면을 붙입니다. 그 전에는 1:1 채팅에서 CFO에게 직접 질문이 더 정확합니다."
    />
  );
}
