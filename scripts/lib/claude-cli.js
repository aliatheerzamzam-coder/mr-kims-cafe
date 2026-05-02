'use strict';

const { spawn } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

function callClaude({ model, persona, userTask, timeoutMs = DEFAULT_TIMEOUT_MS, cwd = ROOT, env = process.env }) {
  return new Promise((resolve, reject) => {
    if (process.env.CLAUDE_MOCK === '1') {
      const stub = [
        '## 한 줄 요약',
        '(CLAUDE_MOCK=1 — 실제 Claude 호출 없이 stub 응답)',
        '',
        '## 핵심 발견',
        `- model=${model}`,
        `- persona length=${(persona || '').length}`,
        `- userTask preview="${(userTask || '').slice(0, 80)}"`,
        '',
        '## 권고 액션',
        '1. 실제 환경에서는 CLAUDE_MOCK 해제 후 재실행',
        '',
        '— claude-cli mock',
      ].join('\n');
      return resolve(stub);
    }

    const args = [
      '--print',
      '--model', model,
      '--permission-mode', 'bypassPermissions',
      '--append-system-prompt', persona,
      userTask,
    ];
    const proc = spawn('claude', args, {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error(`claude timeout after ${Math.round(timeoutMs / 1000)}s`));
    }, timeoutMs);
    proc.stdout.on('data', c => (stdout += c.toString()));
    proc.stderr.on('data', c => (stderr += c.toString()));
    proc.on('error', err => {
      clearTimeout(timer);
      if (err && err.code === 'ENOENT') {
        const friendly = new Error('CLAUDE_NOT_INSTALLED: claude CLI를 찾을 수 없음. 회의 기능은 로컬 환경(claude 설치된 맥)에서만 작동합니다.');
        friendly.code = 'CLAUDE_NOT_INSTALLED';
        return reject(friendly);
      }
      reject(err);
    });
    proc.on('close', code => {
      clearTimeout(timer);
      if (code !== 0) {
        return reject(new Error(`claude exit ${code}: ${stderr.slice(0, 500)}`));
      }
      resolve(stdout.trim());
    });
  });
}

function extractSummaryLine(markdown) {
  if (!markdown) return '';
  const m = markdown.match(/##\s*한 줄 요약[^\n]*\n+([^\n]+)/);
  if (m) return m[1].trim();
  const firstLine = markdown.split('\n').find(l => l.trim().length > 0);
  return (firstLine || '').slice(0, 200);
}

module.exports = { callClaude, extractSummaryLine, DEFAULT_TIMEOUT_MS };
