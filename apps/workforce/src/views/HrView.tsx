import { ComingSoon } from './ComingSoon';

export default function HrView() {
  return (
    <ComingSoon
      ko="인사 / HR"
      en="Human Resources"
      reason="현재 매장 1곳에 직원 수 명. 가짜 평가/온보딩 화면을 띄울 이유가 없습니다."
      whenItWouldHelp="2호점 오픈 또는 직원 10명 이상이 되면 실제 평가/근태/노무 관리 화면을 붙입니다."
    />
  );
}
