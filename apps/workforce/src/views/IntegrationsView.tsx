import { Card, Chip } from '@/components/ui';
import { ComingSoon } from './ComingSoon';

/**
 * Real integrations status — only shows what is actually wired up.
 * Honest list, not a marketing wall of "150+ integrations".
 */
const REAL_INTEGRATIONS: Array<{
  name: string;
  status: 'connected' | 'partial' | 'pending';
  note: string;
}> = [
  { name: 'Anthropic Claude API', status: 'connected', note: '8개 팀 페르소나 + 24명 직원 라우팅' },
  { name: 'SQLite (cafe-warehouse.db)', status: 'connected', note: 'agent_meetings · workforce_tasks · workforce_approvals' },
  { name: 'POS (cashier.html)', status: 'connected', note: '주문/매출 동일 DB 사용' },
  { name: '메인 웹사이트 (mrkimscafe.com)', status: 'connected', note: '영업시간/메뉴 노출' },
  { name: 'Instagram @mr.kims_cafe', status: 'partial', note: '브랜드 계정만 연결, 데이터 자동 수집 X' },
  { name: 'PG (카드 / Zain Cash / Switch)', status: 'pending', note: '미연동 — 결제 수동 수금' },
  { name: 'WhatsApp Business', status: 'pending', note: '주문 알림용으로 검토' },
  { name: 'Google Workspace', status: 'pending', note: '보고서 자동 발송 검토' },
];

const COLOR: Record<'connected' | 'partial' | 'pending', string> = {
  connected: 'var(--mk-green-glow)',
  partial: 'var(--st-busy)',
  pending: '#ff9090',
};

const LABEL: Record<'connected' | 'partial' | 'pending', string> = {
  connected: '연결됨',
  partial: '부분 연결',
  pending: '미연동',
};

export default function IntegrationsView() {
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <header style={{ marginBottom: 18 }}>
        <div className="eyebrow">⊠ 연동 / integrations</div>
        <h1 style={{ fontSize: 30, fontWeight: 900, margin: '8px 0 4px' }}>외부 시스템 연동</h1>
        <p style={{ color: 'var(--fg-mid)', fontFamily: 'var(--font-mono)', fontSize: 13, margin: 0 }}>
          실제 상태만 표시합니다. 가짜 "150+ apps" 카드는 없습니다.
        </p>
      </header>

      <div style={{ display: 'grid', gap: 10 }}>
        {REAL_INTEGRATIONS.map(it => (
          <Card key={it.name} style={{ padding: 16, borderLeft: `3px solid ${COLOR[it.status]}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  background: COLOR[it.status],
                  boxShadow: it.status === 'connected' ? `0 0 8px ${COLOR[it.status]}` : 'none',
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{it.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-soft)', fontFamily: 'var(--font-mono)' }}>{it.note}</div>
              </div>
              <Chip>{LABEL[it.status]}</Chip>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <ComingSoon
          ko="연동 마켓플레이스"
          en="Integration Marketplace"
          reason="자동 OAuth 연동 UI는 아직 의미 있는 외부 시스템이 적습니다."
          whenItWouldHelp="WhatsApp/Instagram Graph/Google Sheets 자동화가 필요해질 때 제대로 구현합니다."
        />
      </div>
    </div>
  );
}
