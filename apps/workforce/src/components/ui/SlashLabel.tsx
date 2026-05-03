interface Props {
  ko: string;
  en: string;
  className?: string;
}

export function SlashLabel({ ko, en, className }: Props) {
  return (
    <span className={className ? `slash ${className}` : 'slash'}>
      <span className="ko">{ko}</span>
      <span className="sep">/</span>
      <span className="en">{en}</span>
    </span>
  );
}
