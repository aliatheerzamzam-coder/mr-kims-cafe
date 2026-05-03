'use strict';

const SEVERITY_ORDER = ['Critical', 'High', 'Medium', 'Low', 'Info'];
const URGENT_LEVELS = new Set(['Critical', 'High']);

const SECRET_PATTERNS = [
  /Bearer\s+[A-Za-z0-9._\-]+/gi,
  /sk-[A-Za-z0-9]{20,}/g,
  /AC[a-f0-9]{32}/g,
  /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g,
  /password["':\s=]+["']?[^"'\s,}]+/gi,
];

function maskSecrets(text) {
  if (!text) return text;
  let out = String(text);
  for (const re of SECRET_PATTERNS) {
    out = out.replace(re, '[REDACTED]');
  }
  return out;
}

function nowKstString() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} KST`;
}

function todayKstDate() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/**
 * @typedef {Object} Finding
 * @property {'Critical'|'High'|'Medium'|'Low'|'Info'} severity
 * @property {string} title
 * @property {string} what  - 무엇을 (정확한 위치/코드/동작)
 * @property {string} why   - 왜 수정해야 하나 (위험성/영향)
 * @property {string} ifNotFixed - 안 고치면 어떤 문제 (구체적 피해)
 * @property {string} [reproduce] - 재현 방법 (선택)
 */

function validateFinding(f, idx) {
  if (!f || typeof f !== 'object') {
    throw new Error(`finding[${idx}] is not an object`);
  }
  if (!SEVERITY_ORDER.includes(f.severity)) {
    throw new Error(`finding[${idx}].severity must be one of ${SEVERITY_ORDER.join(', ')}`);
  }
  for (const key of ['title', 'what', 'why', 'ifNotFixed']) {
    if (!f[key] || typeof f[key] !== 'string' || f[key].trim().length === 0) {
      throw new Error(`finding[${idx}].${key} is required and must be a non-empty string`);
    }
  }
}

function sortFindings(findings) {
  return [...findings].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  );
}

function countBySeverity(findings) {
  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 };
  for (const f of findings) counts[f.severity]++;
  return counts;
}

function hasUrgent(findings) {
  return findings.some(f => URGENT_LEVELS.has(f.severity));
}

function renderFinding(f, idx) {
  const reproduce = f.reproduce ? `\n- **재현**: \`${maskSecrets(f.reproduce)}\`` : '';
  return [
    `### [${f.severity}] ${maskSecrets(f.title)}`,
    `- **무엇을**: ${maskSecrets(f.what)}`,
    `- **왜 수정해야 하나**: ${maskSecrets(f.why)}`,
    `- **안 고치면 어떤 문제**: ${maskSecrets(f.ifNotFixed)}${reproduce}`,
    `- **승인 필요**: [ ] 수정 진행 / [ ] 보류 / [ ] 기각`,
  ].join('\n');
}

/**
 * Build a Markdown report.
 * @param {Object} opts
 * @param {string} opts.kind - 예: "Daily QA", "Daily Report"
 * @param {string} [opts.target] - 대상 (예: "localhost:3000")
 * @param {string} [opts.summary] - 실행 요약 텍스트 (예: "PASS 8 / FAIL 2")
 * @param {Finding[]} opts.findings
 * @param {string} [opts.extra] - 추가 본문 (매출 표 등)
 */
function buildReport(opts) {
  const { kind, target = 'localhost:3000', summary = '', findings = [], extra = '' } = opts;
  if (!kind) throw new Error('kind is required');
  findings.forEach(validateFinding);

  const sorted = sortFindings(findings);
  const counts = countBySeverity(sorted);
  const date = todayKstDate();
  const ranAt = nowKstString();

  const findingsBlock =
    sorted.length === 0
      ? '_발견 사항 없음. 모든 점검 통과._'
      : sorted.map(renderFinding).join('\n\n');

  const lines = [
    `# ${kind} — ${date}`,
    '',
    '## 실행 요약',
    `- 대상: ${target}`,
    `- 실행 시각: ${ranAt}`,
    summary ? `- 결과: ${summary}` : '',
    `- 발견: Critical ${counts.Critical} / High ${counts.High} / Medium ${counts.Medium} / Low ${counts.Low} / Info ${counts.Info}`,
    '',
  ];
  if (extra && extra.trim()) {
    lines.push(extra.trim(), '');
  }
  lines.push('## 발견 사항', '', findingsBlock, '');
  lines.push(
    '## 다음 조치',
    '- 자동 수정 없음. 모든 항목은 사용자 승인 대기.',
    '- 수정하려면 클로드 코드에 "[Critical/High] N번 수정해줘"라고 지시.',
    '- 보류/기각 항목은 다음 보고서에 자동 재등장.',
    ''
  );
  return lines.filter(l => l !== '').join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

function buildShortPush(opts) {
  const { kind, findings = [] } = opts;
  const sorted = sortFindings(findings.filter(f => URGENT_LEVELS.has(f.severity)));
  if (sorted.length === 0) return null;
  const top = sorted.slice(0, 3);
  const head = `[${kind}] ${sorted.length}건 긴급 발견`;
  const body = top
    .map((f, i) => `${i + 1}. [${f.severity}] ${f.title}`)
    .join('\n');
  const tail = sorted.length > top.length ? `\n... 외 ${sorted.length - top.length}건` : '';
  return `${head}\n${body}${tail}\n\n전체 보고서: 이메일/파일 확인`;
}

module.exports = {
  buildReport,
  buildShortPush,
  hasUrgent,
  sortFindings,
  countBySeverity,
  maskSecrets,
  nowKstString,
  todayKstDate,
  SEVERITY_ORDER,
};
