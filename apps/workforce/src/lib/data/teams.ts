import type { Team } from '@/lib/types';

export const TEAMS: Team[] = [
  { id: 'ceo',        name_ko: 'CEO',       name_en: 'CEO',         color: '#a78bfa', glyph: '◆', desc_ko: '최고 경영진',           desc_en: 'CEO Office' },
  { id: 'cfo',        name_ko: '재무',      name_en: 'Finance',     color: '#22d3ee', glyph: '$', desc_ko: '예산·재무',           desc_en: 'Budget & Books' },
  { id: 'coo',        name_ko: '운영',      name_en: 'Operations',  color: '#60a5fa', glyph: '▲', desc_ko: '기획·영업·운영',      desc_en: 'Products, Sales & Ops' },
  { id: 'developer',  name_ko: '개발',      name_en: 'Engineering', color: '#34d399', glyph: '⬢', desc_ko: '구축·운영',           desc_en: 'Build & Ship' },
  { id: 'marketing',  name_ko: '디자인·마케팅', name_en: 'Design & Marketing', color: '#f472b6', glyph: '✺', desc_ko: '브랜드·성장·콘텐츠', desc_en: 'Brand, Growth & Content' },
  { id: 'legal',      name_ko: '법무',      name_en: 'Legal',       color: '#94a3b8', glyph: '§', desc_ko: '계약·컴플라이언스',   desc_en: 'Contracts & Compliance' }
];
