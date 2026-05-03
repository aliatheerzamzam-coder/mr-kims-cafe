import type { Team } from '@/lib/types';

export const TEAMS: Team[] = [
  { id: 'exec',        name_ko: '경영진',   name_en: 'Executive',   color: '#a78bfa', glyph: '◆', desc_ko: '전략·비전',           desc_en: 'Strategy & Vision' },
  { id: 'product',     name_ko: '프로덕트', name_en: 'Product',     color: '#60a5fa', glyph: '▲', desc_ko: '기획·로드맵',         desc_en: 'Spec & Roadmap' },
  { id: 'engineering', name_ko: '개발',     name_en: 'Engineering', color: '#34d399', glyph: '⬢', desc_ko: '구축·운영',           desc_en: 'Build & Ship' },
  { id: 'design',      name_ko: '디자인',   name_en: 'Design',      color: '#fbbf24', glyph: '✦', desc_ko: '브랜드·UX',           desc_en: 'Brand & UX' },
  { id: 'marketing',   name_ko: '마케팅',   name_en: 'Marketing',   color: '#f472b6', glyph: '✺', desc_ko: '성장·콘텐츠',         desc_en: 'Growth & Content' },
  { id: 'sales',       name_ko: '영업',     name_en: 'Sales',       color: '#fb923c', glyph: '▶', desc_ko: '파이프라인',          desc_en: 'Pipeline' },
  { id: 'finance',     name_ko: '재무',     name_en: 'Finance',     color: '#22d3ee', glyph: '$', desc_ko: '예산·재무',           desc_en: 'Budget & Books' },
  { id: 'legal',       name_ko: '법무',     name_en: 'Legal',       color: '#94a3b8', glyph: '§', desc_ko: '계약·컴플라이언스',   desc_en: 'Contracts & Compliance' }
];
