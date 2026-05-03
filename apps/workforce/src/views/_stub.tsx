import { Card, Chip, SlashLabel } from '@/components/ui';

interface Props {
  ko: string;
  en: string;
  step: string;        // e.g. "5b" — when this view will get a real implementation
  description?: string;
}

/**
 * Placeholder used by every Step-5a route. Replaced by real view in 5b/5c/5d.
 */
export function StubView({ ko, en, step, description }: Props) {
  return (
    <div className="slide-up">
      <div className="eyebrow" style={{ marginBottom: 8 }}>STEP 5a · ROUTE OK</div>
      <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.005em', margin: 0 }}>
        <SlashLabel ko={ko} en={en} />
      </h1>
      <p style={{ color: 'var(--fg-mid)', marginTop: 12, maxWidth: 680 }}>
        {description ?? '이 뷰는 라우트만 연결됐어요. 실제 UI는 다음 하위 단계에서.'}
      </p>

      <Card scan style={{ padding: 24, marginTop: 24, maxWidth: 520 }}>
        <div className="eyebrow eyebrow-mid" style={{ marginBottom: 8 }}>PLACEHOLDER</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, color: 'var(--fg-mid)' }}>구현 예정 단계:</span>
          <Chip variant="green">step {step}</Chip>
        </div>
        <hr className="hr" />
        <div className="mono" style={{ fontSize: 11, color: 'var(--fg-faint)' }}>
          route stub · sidebar nav, deep-linking, browser back/forward 모두 동작
        </div>
      </Card>
    </div>
  );
}
