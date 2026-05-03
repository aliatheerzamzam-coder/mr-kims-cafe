'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const RESULTS_JSON = path.join(ROOT, 'test-results', 'results.json');
const REPORTS_DIR = path.join(ROOT, '.claude', 'reports', 'daily-qa');

const { buildReport, buildShortPush, hasUrgent, todayKstDate } = require('./lib/report-template');
const { metaFor, QA_SPECS } = require('./lib/qa-mapping');
const { sendReportEmail } = require('./lib/notify-email');
const { sendWhatsAppPush } = require('./lib/notify-whatsapp');

const TARGET_URL = process.env.QA_TARGET_URL || 'http://localhost:3000';
const SKIP_NOTIFY = process.argv.includes('--no-notify');

function log(...args) {
  // eslint-disable-next-line no-console
  console.log('[daily-qa]', ...args);
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function checkServer(url, timeoutMs = 4000) {
  return new Promise(resolve => {
    const req = http.get(url, res => {
      res.resume();
      resolve(res.statusCode && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function runPlaywright() {
  return new Promise(resolve => {
    const args = ['playwright', 'test', ...QA_SPECS, '--reporter=json,list,html'];
    log('exec npx', args.join(' '));
    const child = spawn('npx', args, {
      cwd: ROOT,
      env: { ...process.env, FORCE_COLOR: '0' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stdout.on('data', d => process.stdout.write(d));
    child.stderr.on('data', d => {
      stderr += d.toString();
      process.stderr.write(d);
    });
    child.on('close', code => {
      resolve({ code, stderr });
    });
  });
}

function readResults() {
  if (!fs.existsSync(RESULTS_JSON)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(RESULTS_JSON, 'utf8'));
  } catch (err) {
    log('failed to parse results.json:', err.message);
    return null;
  }
}

function walkSuites(suites, visit, parentFile) {
  if (!Array.isArray(suites)) return;
  for (const suite of suites) {
    const file = suite.file || parentFile;
    if (Array.isArray(suite.specs)) {
      for (const spec of suite.specs) {
        visit({ file, suiteTitle: suite.title || '', spec });
      }
    }
    if (Array.isArray(suite.suites)) {
      walkSuites(suite.suites, visit, file);
    }
  }
}

function extractFailures(results) {
  const failures = [];
  walkSuites(results.suites, ({ file, spec }) => {
    const tests = Array.isArray(spec.tests) ? spec.tests : [];
    for (const test of tests) {
      const lastResult = (test.results || [])[test.results?.length - 1];
      if (!lastResult) continue;
      if (lastResult.status === 'failed' || lastResult.status === 'timedOut') {
        const errMsg =
          (lastResult.error && (lastResult.error.message || lastResult.error.value)) ||
          'unknown error';
        failures.push({
          specFile: path.basename(file || ''),
          title: spec.title || '(unnamed test)',
          line: spec.line || null,
          error: String(errMsg).split('\n').slice(0, 4).join(' / '),
          status: lastResult.status,
        });
      }
    }
  });
  return failures;
}

function failuresToFindings(failures) {
  return failures.map(f => {
    const meta = metaFor(f.specFile);
    const lineRef = f.line ? `:${f.line}` : '';
    return {
      severity: meta.severity,
      title: `${f.specFile} — ${f.title}`,
      what: `tests/${f.specFile}${lineRef}: "${f.title}" (status=${f.status}). 에러: ${f.error}`,
      why: meta.why,
      ifNotFixed: meta.ifNotFixed,
      reproduce: `npx playwright test ${f.specFile}`,
    };
  });
}

function summaryLine(results) {
  const stats = (results && results.stats) || {};
  const expected = stats.expected ?? 0;
  const unexpected = stats.unexpected ?? 0;
  const skipped = stats.skipped ?? 0;
  const flaky = stats.flaky ?? 0;
  return `PASS ${expected} / FAIL ${unexpected} / FLAKY ${flaky} / SKIP ${skipped}`;
}

async function main() {
  ensureDir(REPORTS_DIR);
  const date = todayKstDate();
  const reportPath = path.join(REPORTS_DIR, `${date}.md`);

  log('target:', TARGET_URL);
  const alive = await checkServer(TARGET_URL);
  if (!alive) {
    const findings = [
      {
        severity: 'High',
        title: 'dev 서버 미가동 — QA 실행 중단',
        what: `${TARGET_URL} 헬스체크 실패. npm start 또는 npm run dev 미실행으로 추정`,
        why: 'localhost:3000이 떠 있어야 자동 QA가 돌아감',
        ifNotFixed: '오늘 QA 보고서 없음 → 잠재적 회귀 미감지',
        reproduce: `curl -I ${TARGET_URL}`,
      },
    ];
    const md = buildReport({
      kind: 'Daily QA',
      target: TARGET_URL,
      summary: 'NOT RUN (server down)',
      findings,
    });
    fs.writeFileSync(reportPath, md, 'utf8');
    log('saved (server down):', reportPath);
    if (!SKIP_NOTIFY) await notifyAll('Daily QA', md, findings);
    process.exit(2);
  }

  const { code, stderr } = await runPlaywright();
  log('playwright exit code:', code);

  const results = readResults();
  if (!results) {
    const findings = [
      {
        severity: 'High',
        title: 'Playwright results.json 누락 — QA 결과 분석 불가',
        what: `${RESULTS_JSON}이 생성되지 않음. exit=${code}`,
        why: '결과 파일 없으면 보고서 자동화 자체가 실패',
        ifNotFixed: '오늘 QA 결과 미확인',
        reproduce: 'npx playwright test 후 test-results/results.json 확인',
      },
    ];
    if (stderr) findings[0].what += `\n  stderr 발췌: ${stderr.slice(0, 400)}`;
    const md = buildReport({
      kind: 'Daily QA',
      target: TARGET_URL,
      summary: 'PARSE FAIL',
      findings,
    });
    fs.writeFileSync(reportPath, md, 'utf8');
    log('saved (parse fail):', reportPath);
    if (!SKIP_NOTIFY) await notifyAll('Daily QA', md, findings);
    process.exit(3);
  }

  const failures = extractFailures(results);
  const findings = failuresToFindings(failures);
  const md = buildReport({
    kind: 'Daily QA',
    target: TARGET_URL,
    summary: summaryLine(results),
    findings,
  });
  fs.writeFileSync(reportPath, md, 'utf8');
  log('saved:', reportPath);
  log('findings:', findings.length, '(urgent:', findings.filter(f => ['Critical', 'High'].includes(f.severity)).length, ')');

  if (!SKIP_NOTIFY) await notifyAll('Daily QA', md, findings);
  process.exit(failures.length > 0 ? 1 : 0);
}

async function notifyAll(kind, markdown, findings) {
  const date = todayKstDate();
  const subject = `[Mr. Kims Cafe] ${kind} ${date} — ${findings.length}건 발견`;
  try {
    await sendReportEmail({ subject, markdown });
    log('email sent');
  } catch (err) {
    log('email failed:', err.message);
  }
  if (hasUrgent(findings)) {
    try {
      const push = buildShortPush({ kind, findings });
      if (push) {
        await sendWhatsAppPush(push);
        log('whatsapp sent');
      }
    } catch (err) {
      log('whatsapp failed:', err.message);
    }
  }
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error('[daily-qa] fatal:', err);
  process.exit(99);
});
