import { Card } from '@/components/ui';

interface Props {
  ko: string;
  en: string;
  reason: string;
  whenItWouldHelp: string;
}

/**
 * Honest "not built yet" placeholder. Used for surfaces that don't yet have a
 * real backend — we deliberately do NOT show fake seed numbers because the
 * founder explicitly asked: "I hate things that just pretend to work."
 */
export function ComingSoon({ ko, en, reason, whenItWouldHelp }: Props) {
  return (
    <div style={{ maxWidth: 760, margin: '40px auto' }}>
      <header style={{ marginBottom: 18 }}>
        <div className="eyebrow">○ 준비 중 / not yet</div>
        <h1 style={{ fontSize: 30, fontWeight: 900, margin: '8px 0 4px' }}>
          {ko} <span style={{ color: 'var(--fg-soft)', fontWeight: 700 }}>/ {en}</span>
        </h1>
      </header>

      <Card style={{ padding: 24, borderLeft: '3px solid var(--st-busy)' }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--st-busy)', letterSpacing: '0.12em', marginBottom: 10 }}>
          ▮ 솔직한 상태
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--fg-mid)', margin: 0 }}>
          이 화면은 아직 진짜로 작동하지 않습니다. 사용자가 "겉만 화려한 가짜는 보고 싶지 않다"고 명시했기 때문에,
          가짜 데이터를 보여주는 대신 정직하게 <strong>준비 중</strong>으로 표시합니다.
        </p>
        <hr className="hr" style={{ margin: '14px 0' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
          <div>
            <span className="mono" style={{ color: 'var(--fg-soft)', fontSize: 11, marginRight: 8 }}>왜 비어있나</span>
            {reason}
          </div>
          <div>
            <span className="mono" style={{ color: 'var(--fg-soft)', fontSize: 11, marginRight: 8 }}>언제 의미 있는가</span>
            {whenItWouldHelp}
          </div>
        </div>
      </Card>

      <div style={{ marginTop: 18, color: 'var(--fg-faint)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
        지금 작동하는 것: <strong style={{ color: 'var(--mk-green-glow)' }}>홈 · 회의실 · 작업 · 결재 · 1:1 채팅 · 직원 디렉터리 · 조직도</strong>
      </div>
    </div>
  );
}
