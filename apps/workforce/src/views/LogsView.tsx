import { ComingSoon } from './ComingSoon';

export default function LogsView() {
  return (
    <ComingSoon
      ko="시스템 로그 / Logs"
      en="System Logs"
      reason="서버 로그 스트리밍/Anthropic API 콜 트레이싱은 아직 구현 안 됨. 가짜 콘솔 출력은 운영에 도움 안 됩니다."
      whenItWouldHelp="개발자가 디버깅 필요할 때, server.js의 console.log + Anthropic 사용량 + 에러를 실시간으로 보여주는 화면을 붙입니다. 지금은 감사 로그 화면이 더 실용적입니다."
    />
  );
}
