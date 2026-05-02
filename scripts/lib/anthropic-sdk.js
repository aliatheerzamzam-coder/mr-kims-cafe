'use strict';

const { Anthropic } = require('@anthropic-ai/sdk');

const MODEL_MAP = {
  opus:   'claude-opus-4-5',
  sonnet: 'claude-sonnet-4-6',
  haiku:  'claude-haiku-4-5',
};

let _client = null;
function client() {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error('ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다. .env 파일에 추가하세요.');
    err.code = 'ANTHROPIC_KEY_MISSING';
    throw err;
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

function resolveModel(alias) {
  if (!alias) return MODEL_MAP.sonnet;
  if (alias.startsWith('claude-')) return alias;
  return MODEL_MAP[alias] || MODEL_MAP.sonnet;
}

async function callClaude({ model, persona, userTask, maxTokens = 2048, timeoutMs = 90000 }) {
  if (process.env.CLAUDE_MOCK === '1') {
    return [
      '## 한 줄 요약',
      '(CLAUDE_MOCK=1 — 실제 API 호출 없이 stub 응답)',
      '',
      '## 핵심 발견',
      `- model=${model}`,
      `- persona length=${(persona || '').length}`,
      `- userTask preview="${(userTask || '').slice(0, 80)}"`,
      '',
      '## 권고 액션',
      '1. 실제 환경에서는 CLAUDE_MOCK 해제 후 재실행',
      '',
      '— anthropic-sdk mock',
    ].join('\n');
  }

  const c = client();
  const resolvedModel = resolveModel(model);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await c.messages.create({
      model: resolvedModel,
      max_tokens: maxTokens,
      system: persona,
      messages: [{ role: 'user', content: userTask }],
    }, { signal: controller.signal });

    const textBlock = (response.content || []).find(b => b.type === 'text');
    return (textBlock && textBlock.text ? textBlock.text : '').trim();
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw new Error(`anthropic timeout after ${Math.round(timeoutMs / 1000)}s`);
    }
    if (err && err.status === 401) {
      const e = new Error('ANTHROPIC_KEY_INVALID: API 키가 잘못되었거나 만료됨. console.anthropic.com에서 확인하세요.');
      e.code = 'ANTHROPIC_KEY_INVALID';
      throw e;
    }
    if (err && err.status === 429) {
      const e = new Error('ANTHROPIC_RATE_LIMITED: 요청 한도 초과. 잠시 후 재시도하세요.');
      e.code = 'ANTHROPIC_RATE_LIMITED';
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function extractSummaryLine(markdown) {
  if (!markdown) return '';
  const m = markdown.match(/##\s*한 줄 요약[^\n]*\n+([^\n]+)/);
  if (m) return m[1].trim();
  const firstLine = markdown.split('\n').find(l => l.trim().length > 0);
  return (firstLine || '').slice(0, 200);
}

module.exports = { callClaude, extractSummaryLine, resolveModel, MODEL_MAP };
