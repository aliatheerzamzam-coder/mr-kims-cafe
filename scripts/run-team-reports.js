'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REPORTS_ROOT = path.join(ROOT, '.claude', 'reports', 'team-reports');

const { collectAll } = require('./lib/team-data-source');
const { TEAMS, buildPrompt } = require('./lib/team-prompts');
const { todayKstDate, nowKstString } = require('./lib/report-template');
const { callClaude, extractSummaryLine } = require('./lib/claude-cli');

const SKIP_CLAUDE = process.argv.includes('--no-claude');
const ONLY_TEAM = (() => {
  const idx = process.argv.indexOf('--only');
  if (idx < 0) return null;
  return (process.argv[idx + 1] || '').toLowerCase() || null;
})();

function log(...args) {
  // eslint-disable-next-line no-console
  console.log('[team-reports]', ...args);
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function fallbackReport(team, data, errMsg) {
  const lines = [
    `## 한 줄 요약`,
    `Claude 호출 실패 — ${errMsg.slice(0, 100)}`,
    '',
    `## 핵심 발견`,
    `- Claude CLI 실행 중 오류 발생: ${errMsg.slice(0, 200)}`,
    `- 데이터는 정상 수집됨 (data._raw.json 참고)`,
    `- 수집 에러: ${(data.errors || []).join('; ') || '없음'}`,
    '',
    `## 권고 액션`,
    `1. 사용자가 직접 \`npm run agent:daily-teams:dry\`로 데이터만 확인`,
    `2. claude CLI 인증 상태 점검 (\`claude /status\`)`,
    '',
    `— ${team.label} (자동 생성 fallback)`,
  ];
  return lines.join('\n');
}

function buildIndex(date, teams, summaries, dataMeta) {
  return {
    date,
    generated_at: new Date().toISOString(),
    target_url: dataMeta.target_url,
    prod_url: dataMeta.prod_url,
    teams: teams.map(t => ({
      id: t.id,
      label: t.label,
      model: t.model,
      summary: summaries[t.id] || '(보고서 없음)',
      report_path: `team-reports/${date}/${t.id}.md`,
      ok: !!summaries[t.id] && !summaries[t.id].startsWith('Claude 호출 실패'),
    })),
    data_errors: dataMeta.errors || [],
    web_health: dataMeta.web_health,
    instagram_configured: dataMeta.instagram && dataMeta.instagram.configured,
  };
}

async function main() {
  const date = todayKstDate();
  const dayDir = path.join(REPORTS_ROOT, date);
  ensureDir(dayDir);

  log('collecting data at', nowKstString());
  const data = await collectAll();
  fs.writeFileSync(path.join(dayDir, '_data.json'), JSON.stringify(data, null, 2), 'utf8');
  if (data.errors.length) log('data errors:', data.errors);

  const teamsToRun = ONLY_TEAM ? TEAMS.filter(t => t.id === ONLY_TEAM) : TEAMS;
  if (ONLY_TEAM && teamsToRun.length === 0) {
    log('unknown --only team:', ONLY_TEAM);
    process.exit(2);
  }

  const summaries = {};
  for (const team of teamsToRun) {
    const reportPath = path.join(dayDir, `${team.id}.md`);
    if (SKIP_CLAUDE) {
      const stub = `## 한 줄 요약\n(--no-claude 모드: 데이터 수집만, 보고서 미생성)\n\n— ${team.label}`;
      fs.writeFileSync(reportPath, stub, 'utf8');
      summaries[team.id] = '(--no-claude 모드: 데이터 수집만)';
      log(`[${team.id}] stub saved`);
      continue;
    }

    try {
      log(`[${team.id}] calling claude (${team.model})...`);
      const { persona, userTask } = buildPrompt(team, data, date);
      const out = await callClaude({ model: team.model, persona, userTask });
      const final = out || `(빈 응답)\n— ${team.label}`;
      fs.writeFileSync(reportPath, final, 'utf8');
      summaries[team.id] = extractSummaryLine(final);
      log(`[${team.id}] saved (${final.length} chars)`);
    } catch (err) {
      log(`[${team.id}] FAILED:`, err.message);
      const fb = fallbackReport(team, data, err.message);
      fs.writeFileSync(reportPath, fb, 'utf8');
      summaries[team.id] = `Claude 호출 실패 — ${err.message.slice(0, 80)}`;
    }
  }

  const index = buildIndex(date, teamsToRun, summaries, data);
  fs.writeFileSync(path.join(dayDir, 'index.json'), JSON.stringify(index, null, 2), 'utf8');
  fs.writeFileSync(path.join(REPORTS_ROOT, 'latest.json'), JSON.stringify(index, null, 2), 'utf8');
  log('done. latest.json updated for', date);
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error('[team-reports] fatal:', err);
  process.exit(99);
});
