'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// 페르소나는 프로젝트 폴더 우선 (배포 환경 호환), 없으면 사장님 맥의 ~/.claude/agents 사용 (cron 호환)
const PROJECT_AGENTS_DIR = path.resolve(__dirname, '..', '..', 'agents', 'mrkim');
const HOME_AGENTS_DIR = path.join(os.homedir(), '.claude', 'agents');
const AGENTS_DIR = fs.existsSync(PROJECT_AGENTS_DIR) ? PROJECT_AGENTS_DIR : HOME_AGENTS_DIR;

const TEAMS = [
  { id: 'ceo',        agent: 'mrkim-ceo.md',        label: "Mr. Kim's CEO",         model: 'sonnet', focus: '법인 전략, 사업 확장, 투자, 비전. 단일 매장 운영 디테일은 카페 CEO 영역이니 건드리지 말 것.' },
  { id: 'cfo',        agent: 'mrkim-cfo.md',        label: "Mr. Kim's CFO",         model: 'sonnet', focus: '현금흐름, 매출/마진, 단가, ROI, IQD/USD 환리스크, PG 미연동 영향. 숫자에 집중.' },
  { id: 'coo',        agent: 'mrkim-coo.md',        label: "Mr. Kim's COO",         model: 'sonnet', focus: 'KPI, SOP, 부서간 우선순위, bottleneck. 매장-본사 연결.' },
  { id: 'marketing',  agent: 'mrkim-marketing.md',  label: "Mr. Kim's 마케팅 팀",   model: 'sonnet', focus: '브랜드 일관성, 인스타 @mr.kims_cafe 성과, 타깃 고객, 캠페인 가설. 인스타 데이터 없으면 솔직히 표시.' },
  { id: 'developer',  agent: 'mrkim-developer.md',  label: "Mr. Kim's 풀스택 개발자", model: 'sonnet', focus: '웹사이트/POS health, 응답속도, 에러, 자동수정 절대 금지(보고만), PG 연동 미완료 인지.' },
  { id: 'tax',        agent: 'mrkim-tax.md',        label: "Mr. Kim's 세무팀",      model: 'sonnet', focus: '이라크 부가세/법인세 일정, 매출/매입 증빙 누락 위험. 실제 신고는 현지 회계사 협업 필수임을 명시.' },
  { id: 'legal',      agent: 'mrkim-legal.md',      label: "Mr. Kim's 법무팀",      model: 'sonnet', focus: '계약/약관/개인정보/상표 리스크. 법적 자문은 현지 변호사 검토 필수임을 명시.' },
  { id: 'hr',         agent: 'mrkim-hr.md',         label: "Mr. Kim's HR팀",        model: 'sonnet', focus: '채용/평가/노무/조직문화. 이라크 노동법 + 라마단/금요일 휴일 등 현지 맥락.' },
];

function readAgentBody(agentFilename) {
  const full = path.join(AGENTS_DIR, agentFilename);
  const raw = fs.readFileSync(full, 'utf8');
  return raw.replace(/^---[\s\S]*?---\n/, '').trim();
}

function buildPrompt(team, data, dateKst) {
  const persona = readAgentBody(team.agent);

  const dataExcerpt = JSON.stringify(
    {
      collected_at: data.collected_at,
      sales_today: data.sales && data.sales.day && data.sales.day.today,
      sales_week_total_orders: data.sales && data.sales.week && Array.isArray(data.sales.week.daily)
        ? data.sales.week.daily.reduce((s, d) => s + (d.order_count || 0), 0)
        : null,
      sales_week_top5: data.sales && data.sales.week && data.sales.week.top5,
      sales_month_top5: data.sales && data.sales.month && data.sales.month.top5,
      orders_count_total: data.orders_count_total,
      ingredients_total: data.ingredients_total,
      low_stock: data.low_stock,
      web_health: data.web_health,
      instagram: data.instagram,
      data_errors: data.errors,
    },
    null,
    2
  );

  const userTask = [
    `# 오늘 (${dateKst}) 데일리 보고서 작성`,
    '',
    '## 너의 역할',
    `${team.label}으로서, 아래 수집된 데이터를 너의 관점에서만 분석해서 오늘의 짧은 일일 보고서를 작성한다.`,
    '',
    '## 집중 영역',
    team.focus,
    '',
    '## 출력 형식 (반드시 마크다운, 다른 말 없이 보고서만)',
    '```',
    `## 한 줄 요약`,
    `(오늘의 핵심 한 문장 — 대시보드 카드에 그대로 표시됨)`,
    '',
    `## 핵심 발견`,
    `- 항목 1: 사실 + 너의 해석`,
    `- 항목 2: ...`,
    `- 항목 3: ...`,
    '',
    `## 권고 액션`,
    `1. 우선순위 높은 액션 (담당자/마감 명시)`,
    `2. ...`,
    '',
    `## 리스크 / 주의사항`,
    `- (있으면)`,
    '```',
    '',
    '## 수집된 데이터 (JSON)',
    '```json',
    dataExcerpt,
    '```',
    '',
    '## 규칙',
    '- 한국어로 작성, 전문 용어는 영어 그대로',
    '- 데이터에 없는 내용은 추측하지 말고 "데이터 없음" 또는 "수동 확인 필요"라고 명시',
    '- 보고서는 200-400 단어 분량',
    '- 자동 수정 / 자동 실행 절대 권고하지 않음 — 사용자 승인 필요한 액션만',
    '- PG(카드/Zain/Switch) 연동 미완료 상황은 결제/매출 관련 시 항상 짚을 것',
    '- 마지막에 보고자 이름(예: "— Mr. Kim\'s CFO") 한 줄 추가',
  ].join('\n');

  return { persona, userTask };
}

function getTeamById(id) {
  return TEAMS.find(t => t.id === id) || null;
}

function buildAskPrompt(team, history) {
  const persona = readAgentBody(team.agent);
  const turns = history.map(m => {
    if (m.role === 'user') return `[사장 질문]\n${m.content}`;
    return `[${team.label} 답변]\n${m.content}`;
  });
  const userTask = [
    `# 1:1 즉석 회의 (${team.label})`,
    '',
    '## 너의 역할',
    `${team.label}으로서 사장의 질문에 너의 관점에서만 답한다.`,
    '',
    '## 집중 영역',
    team.focus,
    '',
    '## 대화 기록 (시간순)',
    turns.join('\n\n'),
    '',
    '## 응답 규칙',
    '- 한국어로 작성, 200~400 단어',
    '- 너의 직무 범위 안에서만 답하고, 다른 팀 영역은 "이건 ○○팀이 봐야 할 부분" 한 줄로만 표시',
    '- 데이터 없으면 추측 금지, "데이터 없음" 또는 "수동 확인 필요" 명시',
    '- 자동 수정/자동 실행 금지, 사용자 승인 필요한 액션만',
    '- PG(카드/Zain/Switch) 미연동 상황은 결제/매출 관련 시 항상 짚을 것',
    '- 답변 끝에 "— ' + team.label + '" 한 줄',
  ].join('\n');
  return { persona, userTask };
}

function buildMeetingPrompt(team, topic, otherTeams) {
  const persona = readAgentBody(team.agent);
  const others = otherTeams.filter(t => t.id !== team.id).map(t => t.label).join(', ') || '없음';
  const userTask = [
    `# 다자 회의 — 주제: ${topic}`,
    '',
    '## 너의 역할',
    `${team.label}으로서 위 주제에 대한 너의 의견을 단독으로 제시한다. 다른 팀(${others})도 같은 주제로 동시에 답하고 있고, 사장이 나중에 답변들을 비교한다.`,
    '',
    '## 집중 영역',
    team.focus,
    '',
    '## 응답 규칙',
    '- 한국어, 150~300 단어',
    '- 입장(찬성/반대/보류) 한 줄 → 핵심 근거 3개 → 권고 액션 1~2개 순서',
    '- 너의 직무 범위 밖 코멘트 금지',
    '- 데이터 없으면 추측 금지',
    '- 자동 수정/자동 실행 권고 금지',
    '- 답변 끝에 "— ' + team.label + '" 한 줄',
  ].join('\n');
  return { persona, userTask };
}

function buildReportPrompt(team, topic) {
  const persona = readAgentBody(team.agent);
  const userTask = [
    `# 주제별 보고서 — ${topic}`,
    '',
    '## 너의 역할',
    `${team.label}으로서 위 주제에 대한 분석 보고서를 작성한다.`,
    '',
    '## 집중 영역',
    team.focus,
    '',
    '## 출력 형식 (마크다운, 보고서만)',
    '```',
    '## 한 줄 요약',
    '(주제 핵심 한 문장)',
    '',
    '## 배경 / 가정',
    '- 어떤 데이터/맥락에 근거해서 보는가',
    '',
    '## 분석',
    '- 항목 1: 사실 + 해석',
    '- 항목 2: ...',
    '',
    '## 권고 액션',
    '1. 우선순위 높은 액션 (담당/마감 명시)',
    '2. ...',
    '',
    '## 리스크',
    '- (있으면)',
    '```',
    '',
    '## 규칙',
    '- 한국어, 300~500 단어',
    '- 데이터 없으면 추측 금지, "데이터 없음" 명시',
    '- 자동 수정 권고 금지',
    '- PG 미연동은 결제 관련 시 항상 짚을 것',
    '- 마지막에 "— ' + team.label + '" 한 줄',
  ].join('\n');
  return { persona, userTask };
}

module.exports = {
  TEAMS,
  buildPrompt,
  readAgentBody,
  getTeamById,
  buildAskPrompt,
  buildMeetingPrompt,
  buildReportPrompt,
};
