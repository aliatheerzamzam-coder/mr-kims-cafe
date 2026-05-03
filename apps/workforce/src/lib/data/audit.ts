import type { AuditEntry } from '@/lib/types';

/** Audit log — newest first (display order). */
export const AUDIT_LOG: AuditEntry[] = [
  { t: '10:42:18', actor: 'sls-1',  action: 'salesforce.opportunity.update', target: 'Acme Co — $48,000',                 result: 'ok',       severity: 'info',    ip: '10.0.42.7' },
  { t: '10:41:52', actor: 'eng-1',  action: 'github.pr.merge',                target: 'yourco/api · #482',                 result: 'ok',       severity: 'info',    ip: '10.0.18.2' },
  { t: '10:39:04', actor: 'cfo',    action: 'stripe.refund.request',          target: 'cust_4F9X · $1,200',                result: 'pending',  severity: 'high',    ip: '10.0.3.1',  approval_id: 'ap-2941' },
  { t: '10:36:11', actor: 'mkt-2',  action: 'hubspot.campaign.send',          target: 'Q2 Reactivation · 12,400 받는이',   result: 'pending',  severity: 'high',    ip: '10.0.21.4', approval_id: 'ap-2940' },
  { t: '10:34:00', actor: 'lgl-1',  action: 'docusign.envelope.send',         target: 'Acme MSA v3.docx',                  result: 'pending',  severity: 'high',    ip: '10.0.9.3',  approval_id: 'ap-2939' },
  { t: '10:33:42', actor: 'eng-3',  action: 'infra.deploy.production',        target: 'api-gateway · v2.18.0',             result: 'ok',       severity: 'high',    ip: '10.0.18.4' },
  { t: '10:30:08', actor: 'ceo',    action: 'approval.grant',                 target: 'ap-2938 · $12,000 광고예산',        result: 'ok',       severity: 'info',    ip: '10.0.1.1' },
  { t: '10:28:47', actor: 'cmo',    action: 'approval.request',               target: 'ap-2938 · $12,000 광고예산',        result: 'ok',       severity: 'info',    ip: '10.0.21.1' },
  { t: '10:25:33', actor: 'des-2',  action: 'figma.file.publish',             target: 'Onboarding v3 · main',              result: 'ok',       severity: 'info',    ip: '10.0.12.2' },
  { t: '10:22:12', actor: 'eng-4',  action: 'test.suite.run',                 target: 'checkout-e2e',                      result: 'fail',     severity: 'warning', ip: '10.0.18.5' },
  { t: '10:20:01', actor: 'fin-1',  action: 'qbo.report.export',              target: 'Cash Flow Q2.xlsx',                 result: 'ok',       severity: 'info',    ip: '10.0.6.1' },
  { t: '10:18:42', actor: 'cto',    action: 'policy.update',                  target: 'code-review · require 2 reviewers', result: 'ok',       severity: 'high',    ip: '10.0.18.1' },
  { t: '10:17:09', actor: 'system', action: 'rate_limit.trigger',             target: 'mkt-3 · 50 req/min 초과',           result: 'throttle', severity: 'warning', ip: '—' },
  { t: '10:14:38', actor: 'sls-1',  action: 'gmail.send',                     target: 'outreach · 24 받는이',              result: 'ok',       severity: 'info',    ip: '10.0.21.7' },
  { t: '10:11:02', actor: 'ceo',    action: 'approval.deny',                  target: 'ap-2935 · 신규 SaaS 구독',          result: 'ok',       severity: 'info',    ip: '10.0.1.1' },
  { t: '10:08:14', actor: 'lgl-1',  action: 'policy.compliance.scan',         target: 'DPA · vendor-9281',                 result: 'ok',       severity: 'info',    ip: '10.0.9.3' },
  { t: '09:58:27', actor: 'system', action: 'auth.session.start',             target: 'ceo · 새 세션',                     result: 'ok',       severity: 'info',    ip: '10.0.1.1' },
  { t: '09:42:11', actor: 'eng-2',  action: 'github.push',                    target: 'yourco/web · feature/checkout-v2',  result: 'ok',       severity: 'info',    ip: '10.0.18.3' }
];
